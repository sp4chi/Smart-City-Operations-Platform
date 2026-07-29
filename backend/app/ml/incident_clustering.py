from typing import List, Dict, Any
from collections import defaultdict

class IncidentClusteringEngine:
    
    @staticmethod
    def cluster_and_summarize_alerts(alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups active alerts by district and domain to detect cascading city incidents
        and produces automated plain-language summaries.
        """
        if not alerts:
            return []
            
        grouped = defaultdict(list)
        for alert in alerts:
            key = (alert.get("district_id"), alert.get("domain"))
            grouped[key].append(alert)
            
        incident_clusters = []
        cluster_id = 1
        
        for (district_id, domain), items in grouped.items():
            district_name = items[0].get("district_name", f"District #{district_id}")
            critical_count = sum(1 for a in items if a.get("severity") == "Critical")
            warning_count = sum(1 for a in items if a.get("severity") == "Warning")
            
            if critical_count > 0:
                overall_severity = "Critical"
            elif warning_count > 0:
                overall_severity = "Warning"
            else:
                overall_severity = "Info"

            alert_titles = [a.get("title") for a in items]
            
            # Plain language automated summary
            summary = (
                f"Cascade operational event detected in {district_name} ({domain.upper()} domain). "
                f"Cluster contains {len(items)} correlated alerts ({critical_count} Critical, {warning_count} Warning). "
                f"Key triggers: {', '.join(alert_titles[:3])}."
            )
            
            incident_clusters.append({
                "cluster_id": f"INC-CLUSTER-{cluster_id:03d}",
                "district_name": district_name,
                "domain": domain,
                "alert_count": len(items),
                "severity": overall_severity,
                "summary": summary,
                "alerts": items
            })
            cluster_id += 1
            
        return incident_clusters
