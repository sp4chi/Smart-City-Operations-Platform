from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.db.models import Alert, District
from app.ml.rag_assistant import CityOperationsRAGAssistant
from app.ml.incident_clustering import IncidentClusteringEngine

router = APIRouter(prefix="/ai", tags=["AI Native Capabilities"])

class ChatRequest(BaseModel):
    prompt: str

@router.post("/chat")
def chat_with_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
    res = CityOperationsRAGAssistant.query_assistant(req.prompt, db)
    return res

@router.get("/incidents/summary")
def get_incident_summaries(db: Session = Depends(get_db)):
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).all()
    districts = {d.id: d.name for d in db.query(District).all()}
    
    alert_dicts = []
    for a in active_alerts:
        alert_dicts.append({
            "id": a.id,
            "code": a.alert_code,
            "domain": a.domain,
            "district_id": a.district_id,
            "district_name": districts.get(a.district_id, f"District {a.district_id}"),
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "root_cause_hint": a.root_cause_hint
        })
        
    clusters = IncidentClusteringEngine.cluster_and_summarize_alerts(alert_dicts)
    return {
        "active_alerts_count": len(active_alerts),
        "incident_clusters": clusters
    }
