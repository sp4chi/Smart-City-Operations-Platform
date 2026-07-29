import os
import logging
from typing import Dict, Any, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models import (
    District, Alert, ServiceRequest311, InfrastructureAsset, UtilitiesAsset, TrafficCorridor
)

logger = logging.getLogger("rag_assistant")

class CityOperationsRAGAssistant:
    
    @classmethod
    def query_assistant(cls, prompt: str, db: Session) -> Dict[str, Any]:
        """
        Executes grounded operational query by gathering live DB context
        and synthesizing plain language answer via Gemini API.
        Grounded fallback is disabled per user request to test direct Gemini API calls.
        """
        context_data = cls._gather_live_context(db)
        
        # Check if Gemini API Key is available
        if not settings.GEMINI_API_KEY or len(settings.GEMINI_API_KEY.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="GEMINI_API_KEY is not configured in backend/.env."
            )
            
        candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest"
        ]
        seen = set()
        models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]
        
        last_error = None
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            system_instruction = (
                "You are CityPulse Operations Assistant, an AI co-pilot for municipal operations staff. "
                "Use ONLY the provided live operational database snapshot to answer the user's question accurately. "
                "Be direct, structured, include exact metrics/district names/alert codes, and highlight actionable next steps."
            )
            
            full_prompt = f"{system_instruction}\n\n[LIVE OPERATIONAL DATABASE SNAPSHOT]\n{context_data['text_summary']}\n\n[USER QUERY]\n{prompt}"
            
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting Gemini generation with model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=full_prompt,
                    )
                    if response and hasattr(response, "text") and response.text:
                        return {
                            "answer": response.text,
                            "mode": f"gemini_llm ({model_name})",
                            "sources": context_data["citations"]
                        }
                except Exception as model_err:
                    logger.error(f"Gemini model '{model_name}' failed: {model_err}")
                    last_error = model_err
                    continue

        except Exception as e:
            logger.error(f"Gemini API initialization error: {e}")
            raise HTTPException(status_code=500, detail=f"Gemini API Initialization Failed: {e}")

        # Direct Exception raise if all candidate models failed (Fallback Disabled for Testing)
        raise HTTPException(
            status_code=502,
            detail=f"All Gemini models failed. Last error: {last_error}"
        )

    @classmethod
    def _gather_live_context(cls, db: Session) -> Dict[str, Any]:
        districts = db.query(District).all()
        alerts = db.query(Alert).filter(Alert.is_resolved == False).all()
        open_311 = db.query(ServiceRequest311).filter(ServiceRequest311.status == "Open").all()
        high_risk_infra = db.query(InfrastructureAsset).filter(InfrastructureAsset.risk_level.in_(["High", "Critical"])).all()
        util_assets = db.query(UtilitiesAsset).all()
        traffic_corridors = db.query(TrafficCorridor).all()
        
        district_summary = []
        for d in districts:
            district_summary.append(f"- District {d.id} ({d.name}): Pop {d.population:,}")
            
        alert_summary = []
        for a in alerts:
            d_name = next((d.name for d in districts if d.id == a.district_id), f"District {a.district_id}")
            alert_summary.append(f"- [{a.severity}] {a.alert_code}: {a.title} in {d_name} ({a.domain}). Hint: {a.root_cause_hint}")
            
        infra_summary = []
        for i in high_risk_infra:
            d_name = next((d.name for d in districts if d.id == i.district_id), f"District {i.district_id}")
            infra_summary.append(f"- {i.name} ({i.asset_type}) in {d_name}: Condition {i.condition_score:.1f}/100, Risk {i.risk_level}, Est Fail {i.estimated_days_to_failure} days")
            
        summary_text = (
            f"Active City Districts ({len(districts)}):\n" + "\n".join(district_summary) + "\n\n" +
            f"Active Unresolved Alerts ({len(alerts)}):\n" + ("\n".join(alert_summary) if alert_summary else "No active unresolved alerts.") + "\n\n" +
            f"Open 311 Citizen Requests Backlog: {len(open_311)} tickets pending.\n\n" +
            f"High / Critical Risk Infrastructure Assets ({len(high_risk_infra)}):\n" + ("\n".join(infra_summary) if infra_summary else "All assets operating at nominal condition.")
        )
        
        citations = [
            f"{len(districts)} City Districts",
            f"{len(alerts)} Active Alerts",
            f"{len(open_311)} Open 311 Requests",
            f"{len(high_risk_infra)} Critical Infrastructure Assets"
        ]
        
        return {
            "text_summary": summary_text,
            "citations": citations,
            "districts": districts,
            "alerts": alerts,
            "open_311": open_311,
            "high_risk_infra": high_risk_infra,
            "util_assets": util_assets,
            "traffic_corridors": traffic_corridors
        }
