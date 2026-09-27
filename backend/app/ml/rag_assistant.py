import os
import re
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models import (
    District, Alert, ServiceRequest311, InfrastructureAsset, UtilitiesAsset, TrafficCorridor,
    EmergencyUnit, MaintenanceTicket
)
from app.ml.prompt_constants import GROUNDING_CLAUSE, EXPLAINABILITY_CLAUSE

logger = logging.getLogger("rag_assistant")

# Short-term TTL in-memory context cache (3 seconds)
_context_cache = {"timestamp": 0.0, "data": None}


class CityOperationsRAGAssistant:

    @classmethod
    def execute_tool(cls, tool_name: str, args: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Executes operational mutation tools directly on the CityPulse database."""
        now = datetime.now(timezone.utc)
        
        if tool_name == "resolve_alert":
            raw_id = str(args.get("alert_code_or_id", "")).strip()
            alert = db.query(Alert).filter(Alert.alert_code == raw_id).first()
            if not alert and raw_id.isdigit():
                alert = db.get(Alert, int(raw_id))
            if not alert and raw_id:
                alert = db.query(Alert).filter(
                    Alert.is_resolved == False,
                    Alert.alert_code.ilike(f"%{raw_id}%")
                ).first()
            if not alert:
                alert = db.query(Alert).filter(Alert.is_resolved == False).order_by(Alert.id.desc()).first()
                
            if alert:
                alert.is_resolved = True
                alert.resolved_at = now
                db.commit()
                return {
                    "tool": "resolve_alert",
                    "status": "success",
                    "message": f"Alert {alert.alert_code} ('{alert.title}') has been marked as RESOLVED.",
                    "details": {"alert_id": alert.id, "alert_code": alert.alert_code, "resolved_at": now.isoformat()}
                }
            return {
                "tool": "resolve_alert",
                "status": "warning",
                "message": f"No active alert matching '{raw_id}' was found to resolve."
            }

        elif tool_name == "dispatch_emergency":
            district_id = int(args.get("district_id", 1))
            unit_type = args.get("unit_type")
            query = db.query(EmergencyUnit).filter(EmergencyUnit.district_id == district_id)
            if unit_type:
                query = query.filter(EmergencyUnit.unit_type.ilike(f"%{unit_type}%"))
            unit = query.filter(EmergencyUnit.status == "Available").first()
            if not unit:
                unit = db.query(EmergencyUnit).filter(EmergencyUnit.status == "Available").first()
            if not unit:
                unit = query.first()
                
            if unit:
                unit.status = "Dispatched"
                unit.active_incidents_count = (unit.active_incidents_count or 0) + 1
                unit.last_updated = now
                db.commit()
                d = db.get(District, unit.district_id)
                return {
                    "tool": "dispatch_emergency",
                    "status": "success",
                    "message": f"Dispatched {unit.unit_code} ({unit.unit_type}) to {d.name if d else f'District {district_id}'}. ETA: {round(unit.avg_response_time_min, 1)} mins.",
                    "details": {
                        "unit_code": unit.unit_code,
                        "unit_type": unit.unit_type,
                        "district_id": unit.district_id,
                        "eta_minutes": round(unit.avg_response_time_min, 1)
                    }
                }
            return {
                "tool": "dispatch_emergency",
                "status": "warning",
                "message": f"No emergency units available for dispatch in District {district_id}."
            }

        elif tool_name == "create_maintenance_ticket":
            district_id = int(args.get("district_id", 1))
            title = args.get("title", "Municipal Repair Order")
            priority = args.get("priority", "High")
            tck_code = f"TCK-AI-{now.strftime('%Y%m%d%H%M%S')}"
            ticket = MaintenanceTicket(
                ticket_code=tck_code,
                asset_type="infrastructure",
                asset_id=1,
                district_id=district_id,
                priority=priority,
                title=f"[AI Co-Pilot] {title}",
                description="Auto-generated maintenance ticket created via Operations Assistant prompt.",
                status="Approved"
            )
            db.add(ticket)
            db.commit()
            d = db.get(District, district_id)
            return {
                "tool": "create_maintenance_ticket",
                "status": "success",
                "message": f"Created approved work order {tck_code} for {d.name if d else f'District {district_id}'} ({priority} Priority).",
                "details": {"ticket_code": tck_code, "priority": priority, "district_id": district_id}
            }

        elif tool_name == "reroute_traffic":
            district_id = int(args.get("district_id", 1))
            corridor = db.query(TrafficCorridor).filter(TrafficCorridor.district_id == district_id).first()
            if corridor:
                corridor.congestion_index = max(10.0, corridor.congestion_index - 30.0)
                corridor.speed_mph = min(50.0, corridor.speed_mph + 12.0)
                corridor.incident_active = False
                corridor.last_updated = now
                db.commit()
                return {
                    "tool": "reroute_traffic",
                    "status": "success",
                    "message": f"Signal timings optimized and detour diversion broadcasted for {corridor.name}.",
                    "details": {"corridor_name": corridor.name, "congestion_index": corridor.congestion_index}
                }
            return {
                "tool": "reroute_traffic",
                "status": "warning",
                "message": f"No arterial traffic corridor found for District {district_id}."
            }

        return {"tool": tool_name, "status": "unknown_tool", "message": f"Tool '{tool_name}' unrecognized."}

    @classmethod
    def _detect_and_execute_intent(cls, prompt: str, db: Session, context_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parses natural language operational commands and executes matching database tools."""
        p_lower = prompt.lower()
        
        # 1. Resolve alert intent
        if "resolve" in p_lower and ("alert" in p_lower or "alt-" in p_lower):
            code_match = re.search(r'(?:alert\s+)?([A-Za-z0-9\-_]+)', prompt, re.IGNORECASE)
            alert_token = ""
            if "alert " in p_lower:
                alert_token = prompt.split("alert", 1)[1].strip().split()[0]
            elif "alt-" in p_lower:
                m = re.search(r'(ALT-[A-Za-z0-9\-]+)', prompt, re.IGNORECASE)
                if m:
                    alert_token = m.group(1)
            result = cls.execute_tool("resolve_alert", {"alert_code_or_id": alert_token}, db)
            return {
                "answer": f"### Operational Command Executed\n{result['message']}\n\n**Action Status**: Confirmed and committed to live operations database.",
                "mode": "agentic_tool_execution",
                "sources": context_data["citations"],
                "action_executed": result
            }

        # 2. Dispatch emergency unit intent
        if "dispatch" in p_lower or "deploy" in p_lower:
            unit_type = None
            if "fire" in p_lower:
                unit_type = "Fire"
            elif "ems" in p_lower or "ambulance" in p_lower:
                unit_type = "EMS"
            elif "police" in p_lower:
                unit_type = "Police"
                
            dist_id = 1
            dist_match = re.search(r'district\s*#?\s*(\d+)', p_lower)
            if dist_match:
                dist_id = int(dist_match.group(1))
            elif "northside" in p_lower:
                dist_id = 2
            elif "riverfront" in p_lower or "east" in p_lower:
                dist_id = 3
            elif "heights" in p_lower or "west" in p_lower:
                dist_id = 4
            elif "suburbs" in p_lower or "south" in p_lower:
                dist_id = 5
                
            result = cls.execute_tool("dispatch_emergency", {"district_id": dist_id, "unit_type": unit_type}, db)
            return {
                "answer": f"### Operational Command Executed\n{result['message']}\n\n**Action Status**: Unit status switched to DISPATCHED with telemetry tracking active.",
                "mode": "agentic_tool_execution",
                "sources": context_data["citations"],
                "action_executed": result
            }

        # 3. Create maintenance ticket intent
        if ("create" in p_lower or "issue" in p_lower or "open" in p_lower) and ("ticket" in p_lower or "work order" in p_lower or "repair" in p_lower):
            dist_id = 1
            dist_match = re.search(r'district\s*#?\s*(\d+)', p_lower)
            if dist_match:
                dist_id = int(dist_match.group(1))
            elif "northside" in p_lower:
                dist_id = 2
            elif "riverfront" in p_lower or "east" in p_lower:
                dist_id = 3
            elif "heights" in p_lower or "west" in p_lower:
                dist_id = 4
            elif "suburbs" in p_lower or "south" in p_lower:
                dist_id = 5
                
            result = cls.execute_tool("create_maintenance_ticket", {
                "district_id": dist_id,
                "title": prompt[:80],
                "priority": "Critical" if "critical" in p_lower or "urgent" in p_lower else "High"
            }, db)
            return {
                "answer": f"### Operational Command Executed\n{result['message']}\n\n**Action Status**: Approved work order registered in maintenance system.",
                "mode": "agentic_tool_execution",
                "sources": context_data["citations"],
                "action_executed": result
            }

        # 4. Reroute traffic intent
        if ("reroute" in p_lower or "divert" in p_lower or "optimize" in p_lower) and ("traffic" in p_lower or "corridor" in p_lower or "congestion" in p_lower):
            dist_id = 2
            dist_match = re.search(r'district\s*#?\s*(\d+)', p_lower)
            if dist_match:
                dist_id = int(dist_match.group(1))
            result = cls.execute_tool("reroute_traffic", {"district_id": dist_id}, db)
            return {
                "answer": f"### Operational Command Executed\n{result['message']}\n\n**Action Status**: Adaptive signal controller parameters deployed to corridor.",
                "mode": "agentic_tool_execution",
                "sources": context_data["citations"],
                "action_executed": result
            }

        return None

    @classmethod
    def query_assistant(cls, prompt: str, db: Session) -> Dict[str, Any]:
        """
        Executes grounded operational query by gathering live DB context,
        evaluating tool-calling commands, and synthesizing answers via Gemini or fallback.
        """
        context_data = cls._get_cached_live_context(db)

        # 1. Check for explicit agentic command / intent execution
        intent_result = cls._detect_and_execute_intent(prompt, db, context_data)
        if intent_result:
            return intent_result

        if not settings.GEMINI_API_KEY or len(settings.GEMINI_API_KEY.strip()) < 5:
            logger.info("GEMINI_API_KEY is not configured. Falling back to grounded rule engine.")
            return cls._synthesize_grounded_fallback(prompt.lower(), context_data)


        candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest",
        ]
        seen = set()
        models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

        last_error = None
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            system_instruction = (
                "You are CityPulse Operations Assistant, an AI co-pilot for municipal operations staff. "
                "Use ONLY the provided live operational database snapshot to answer the user's question accurately. "
                "Be direct, structured, include exact metrics/district names/alert codes, and highlight actionable next steps.\n\n"
                f"{GROUNDING_CLAUSE}\n\n"
                f"{EXPLAINABILITY_CLAUSE}"
            )

            full_prompt = (
                f"{system_instruction}\n\n"
                f"[LIVE OPERATIONAL DATABASE SNAPSHOT]\n{context_data['text_summary']}\n\n"
                f"[USER QUERY]\n{prompt}"
            )

            config = types.GenerateContentConfig(
                temperature=0.2,
                top_p=0.8,
                max_output_tokens=600,
            )

            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting Gemini generation with model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=full_prompt,
                        config=config,
                    )
                    if response and hasattr(response, "text") and response.text:
                        return {
                            "answer": response.text,
                            "mode": f"gemini_llm ({model_name})",
                            "sources": context_data["citations"],
                        }
                except Exception as model_err:
                    logger.warning(
                        f"Gemini model '{model_name}' failed: {type(model_err).__name__}: {model_err}. "
                        "Trying next candidate model..."
                    )
                    last_error = model_err
                    continue

        except Exception as e:
            logger.error(f"Gemini API initialization error: {type(e).__name__}: {e}")
            last_error = e

        logger.warning(
            f"All Gemini models failed at runtime (last error: {last_error}). "
            "Falling back to grounded rule engine."
        )
        return cls._synthesize_grounded_fallback(prompt.lower(), context_data)

    @classmethod
    def _get_cached_live_context(cls, db: Session) -> Dict[str, Any]:
        global _context_cache
        now = time.time()
        if _context_cache["data"] and (now - _context_cache["timestamp"]) < 3.0:
            return _context_cache["data"]

        data = cls._gather_live_context(db)
        _context_cache = {"timestamp": now, "data": data}
        return data

    @classmethod
    def _gather_live_context(cls, db: Session) -> Dict[str, Any]:
        districts = db.query(District).all()
        alerts = (
            db.query(Alert)
            .filter(Alert.is_resolved == False)
            .order_by(Alert.id.desc())
            .limit(15)
            .all()
        )
        open_311 = db.query(ServiceRequest311).filter(ServiceRequest311.status == "Open").all()
        high_risk_infra = db.query(InfrastructureAsset).filter(
            InfrastructureAsset.risk_level.in_(["High", "Critical"])
        ).all()
        util_assets = db.query(UtilitiesAsset).all()
        traffic_corridors = db.query(TrafficCorridor).all()

        district_lookup = {d.id: d.name for d in districts}

        district_summary = [
            f"- District {d.id} ({d.name}): Pop {d.population:,}" for d in districts
        ]

        alert_summary = []
        for a in alerts:
            d_name = district_lookup.get(a.district_id, f"District {a.district_id}")
            # Include detailed description so Gemini knows exact sub-type (Water Leak vs Power Surge vs Gas)
            alert_summary.append(
                f"- [{a.severity}] {a.alert_code}: {a.title} in {d_name} ({a.domain}). Details: {a.description}. Hint: {a.root_cause_hint}"
            )

        infra_summary = []
        for i in high_risk_infra:
            d_name = district_lookup.get(i.district_id, f"District {i.district_id}")
            infra_summary.append(
                f"- {i.name} ({i.asset_type}) in {d_name}: Condition {i.condition_score:.1f}/100, "
                f"Risk {i.risk_level}, Est Fail {i.estimated_days_to_failure} days"
            )

        summary_text = (
            f"Active City Districts ({len(districts)}):\n" + "\n".join(district_summary) + "\n\n"
            f"Active Unresolved Alerts (Top {len(alerts)}):\n"
            + ("\n".join(alert_summary) if alert_summary else "No active unresolved alerts.") + "\n\n"
            f"Open 311 Citizen Requests Backlog: {len(open_311)} tickets pending.\n\n"
            f"High / Critical Risk Infrastructure Assets ({len(high_risk_infra)}):\n"
            + ("\n".join(infra_summary) if infra_summary else "All assets operating at nominal condition.")
        )

        citations = [
            f"{len(districts)} City Districts",
            f"{len(alerts)} Active Alerts",
            f"{len(open_311)} Open 311 Requests",
            f"{len(high_risk_infra)} Critical Infrastructure Assets",
        ]

        return {
            "text_summary": summary_text,
            "citations": citations,
            "districts": districts,
            "alerts": alerts,
            "open_311": open_311,
            "high_risk_infra": high_risk_infra,
            "util_assets": util_assets,
            "traffic_corridors": traffic_corridors,
        }

    @classmethod
    def _synthesize_grounded_fallback(cls, prompt_lower: str, context: Dict[str, Any]) -> Dict[str, Any]:
        alerts = context["alerts"]
        open_311 = context["open_311"]
        infra = context["high_risk_infra"]

        if "water" in prompt_lower or "leak" in prompt_lower or "utilities" in prompt_lower:
            water_alerts = [a for a in alerts if a.domain == "utilities" or "water" in a.title.lower() or "water" in a.description.lower()]
            if water_alerts:
                alert_lines = [
                    f"• **{a.alert_code}** ({a.severity}): {a.title} - {a.description}"
                    for a in water_alerts
                ]
                answer = (
                    f"### Water & Utilities Operational Status\n"
                    f"There are currently **{len(water_alerts)} active utilities anomaly alerts** "
                    f"(source: live alerts table):\n\n" + "\n".join(alert_lines) +
                    f"\n\n**Recommendation**: Dispatch a field crew to inspect pressure drop sensors "
                    f"and main line valves in the affected district(s)."
                )
            else:
                answer = (
                    "### Water & Utilities Operational Status\nNo active water/utilities alerts "
                    "in the current unresolved alerts snapshot."
                )

        elif "incident" in prompt_lower or "alert" in prompt_lower or "summarize" in prompt_lower:
            if alerts:
                alert_lines = [
                    f"1. **[{a.severity}] {a.alert_code}**: {a.title} ({a.domain} domain) - {a.description}"
                    for a in alerts
                ]
                answer = (
                    f"### Operational Incident Brief ({len(alerts)} Active Alerts, most recent shown)\n"
                    + "\n".join(alert_lines)
                    + "\n\n**Note**: prioritization above reflects severity tags on each alert as recorded."
                )
            else:
                answer = "### Operational Incident Brief\nNo active alerts in the current unresolved-alerts snapshot."

        elif "infrastructure" in prompt_lower or "asset" in prompt_lower or "risk" in prompt_lower or "bridge" in prompt_lower:
            if infra:
                infra_lines = [
                    f"• **{i.name}** ({i.asset_type.upper()}): Condition {i.condition_score:.1f}/100 | "
                    f"Risk: `{i.risk_level}` | Est Failure: {i.estimated_days_to_failure} days"
                    for i in infra
                ]
                answer = (
                    f"### Infrastructure Predictive Risk Assessment\n"
                    f"**{len(infra)} assets** currently flagged High/Critical risk in the assets table:\n\n"
                    + "\n".join(infra_lines)
                    + "\n\n**Recommendation**: prioritize preventative maintenance for assets with "
                    "the fewest estimated days to failure."
                )
            else:
                answer = (
                    "### Infrastructure Predictive Risk Assessment\nNo assets currently flagged "
                    "High or Critical risk in the assets table."
                )

        elif "311" in prompt_lower or "citizen" in prompt_lower or "request" in prompt_lower or "backlog" in prompt_lower:
            answer = (
                f"### 311 Citizen Service Request Overview\n"
                f"• **Open Requests**: {len(open_311)} tickets pending resolution (source: service_requests_311 table)\n\n"
                f"Ask a more specific question (e.g. category or district) for a narrower breakdown."
            )
        else:
            answer = (
                f"### CityPulse Operations Summary\n"
                f"• **Active Alerts**: {len(alerts)} unresolved (source: alerts table)\n"
                f"• **High-Risk Assets**: {len(infra)} flagged (source: infrastructure_assets table)\n"
                f"• **Open 311 Requests**: {len(open_311)} pending (source: service_requests_311 table)"
            )

        return {
            "answer": answer,
            "mode": "grounded_fallback",
            "sources": context["citations"],
        }
