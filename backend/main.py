import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from backend.database import query_db, query_df
from backend.risk_engine import calculate_customer_risk_score
from backend.regulatory_rag import rag_engine
from backend.copilot_engine import process_copilot_query
from backend.report_generator import generate_pdf_report, REPORTS_DIR

app = FastAPI(
    title="RISKWISE Enterprise Copilot API",
    description="Backend services for Risk, Fraud & Regulatory Intelligence Copilot",
    version="1.0.0"
)

# Enable CORS for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class CopilotRequest(BaseModel):
    query: str
    customer_id: Optional[str] = "C102"

class RegulatorySearchRequest(BaseModel):
    query: str

class ReportGenerateRequest(BaseModel):
    customer_id: str = "C102"
    analyst_name: Optional[str] = "Sarah Jenkins (Senior AML Specialist)"

# ----------------------------------------------------
# 1. DASHBOARD OVERVIEW ENDPOINTS
# ----------------------------------------------------
@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    region: Optional[str] = None
):
    """
    Returns executive dashboard KPIs, risk level distribution, trends, and recent alerts.
    """
    total_tx_res = query_db("SELECT COUNT(*) as count, SUM(amount) as total_vol FROM TRANSACTIONS")
    total_alerts_res = query_db("SELECT COUNT(*) as count FROM RISK_ALERTS")
    high_risk_cust_res = query_db("SELECT COUNT(*) as count FROM CUSTOMERS WHERE risk_rating = 'HIGH'")
    open_cases_res = query_db("SELECT COUNT(*) as count FROM INVESTIGATIONS WHERE investigation_status = 'IN_PROGRESS'")

    # Risk Level Distribution
    risk_dist_rows = query_db("""
        SELECT risk_level, COUNT(*) as count 
        FROM RISK_ALERTS 
        GROUP BY risk_level
    """)
    risk_dist = {r["risk_level"]: r["count"] for r in risk_dist_rows}
    for lvl in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        if lvl not in risk_dist:
            risk_dist[lvl] = 0

    # Recent Alerts Query with Filters
    where_clauses = []
    params = []

    if risk_level and risk_level != "ALL":
        where_clauses.append("ra.risk_level = ?")
        params.append(risk_level)
    if status and status != "ALL":
        where_clauses.append("ra.status = ?")
        params.append(status)
    if region and region != "ALL":
        where_clauses.append("c.country = ?")
        params.append(region)

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    alerts_query = f"""
        SELECT 
            ra.alert_id, ra.customer_id, ra.transaction_id, ra.risk_score, 
            ra.risk_level, ra.primary_risk_signal, ra.status, ra.alert_date,
            c.first_name || ' ' || c.last_name as customer_name, c.country,
            t.amount, t.transaction_type, t.destination_country
        FROM RISK_ALERTS ra
        JOIN CUSTOMERS c ON ra.customer_id = c.customer_id
        JOIN TRANSACTIONS t ON ra.transaction_id = t.transaction_id
        {where_sql}
        ORDER BY ra.alert_date DESC
        LIMIT 15
    """
    recent_alerts = query_db(alerts_query, tuple(params))

    # Daily Anomaly Trend over time
    trends_rows = query_db("""
        SELECT DATE(timestamp) as tx_date, COUNT(*) as tx_count, SUM(CASE WHEN is_anomaly = 1 THEN 1 ELSE 0 END) as anomaly_count
        FROM TRANSACTIONS
        GROUP BY DATE(timestamp)
        ORDER BY tx_date ASC
        LIMIT 30
    """)

    return {
        "kpis": {
            "total_transactions": total_tx_res[0]["count"] if total_tx_res else 0,
            "total_volume": round(total_tx_res[0]["total_vol"] or 0.0, 2) if total_tx_res else 0.0,
            "total_alerts": total_alerts_res[0]["count"] if total_alerts_res else 0,
            "high_risk_customers": high_risk_cust_res[0]["count"] if high_risk_cust_res else 0,
            "open_investigations": open_cases_res[0]["count"] if open_cases_res else 0
        },
        "risk_distribution": risk_dist,
        "recent_alerts": recent_alerts,
        "trends": trends_rows
    }

# ----------------------------------------------------
# 2. RISK ALERTS QUEUE
# ----------------------------------------------------
@app.get("/api/alerts")
def get_alerts(
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    where_clauses = []
    params = []

    if risk_level and risk_level != "ALL":
        where_clauses.append("ra.risk_level = ?")
        params.append(risk_level)
    if status and status != "ALL":
        where_clauses.append("ra.status = ?")
        params.append(status)
    if search:
        where_clauses.append("(ra.customer_id LIKE ? OR ra.alert_id LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)")
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    query = f"""
        SELECT 
            ra.alert_id, ra.customer_id, ra.transaction_id, ra.risk_score, 
            ra.risk_level, ra.primary_risk_signal, ra.status, ra.alert_date,
            c.first_name || ' ' || c.last_name as customer_name,
            t.amount, t.transaction_type, t.destination_country
        FROM RISK_ALERTS ra
        JOIN CUSTOMERS c ON ra.customer_id = c.customer_id
        JOIN TRANSACTIONS t ON ra.transaction_id = t.transaction_id
        {where_sql}
        ORDER BY ra.risk_score DESC, ra.alert_date DESC
        LIMIT ?
    """
    params.append(limit)
    return query_db(query, tuple(params))

# ----------------------------------------------------
# 3. CUSTOMER INVESTIGATION DEEP DIVE
# ----------------------------------------------------
@app.get("/api/customers/{customer_id}")
def get_customer_investigation(customer_id: str):
    cust_rows = query_db("SELECT * FROM CUSTOMERS WHERE customer_id = ?", (customer_id,))
    if not cust_rows:
        raise HTTPException(status_code=404, detail="Customer not found")

    cust = cust_rows[0]
    accounts = query_db("SELECT * FROM ACCOUNTS WHERE customer_id = ?", (customer_id,))
    risk_data = calculate_customer_risk_score(customer_id)

    # Fetch all customer transactions ordered by timestamp
    txs = query_db("SELECT * FROM TRANSACTIONS WHERE customer_id = ? ORDER BY timestamp ASC", (customer_id,))

    # Construction of Visual Timeline Events
    timeline = []
    if txs:
        # Event 1: Baseline Historical Activity
        baseline_txs = [t for t in txs if t['is_anomaly'] == 0]
        if baseline_txs:
            timeline.append({
                "step": 1,
                "stage": "Baseline Historical Activity",
                "date": baseline_txs[0]['timestamp'][:10],
                "description": f"Established low-value domestic transaction baseline (avg ${sum(t['amount'] for t in baseline_txs)/len(baseline_txs):,.2f} USD).",
                "severity": "LOW"
            })

        # Event 2: First Anomaly Spike
        anomaly_txs = [t for t in txs if t['is_anomaly'] == 1 or t['status'] == 'FLAGGED']
        if anomaly_txs:
            timeline.append({
                "step": 2,
                "stage": "Transaction Velocity Spike",
                "date": anomaly_txs[0]['timestamp'][:10],
                "description": f"Initial high-value transfer detected (${anomaly_txs[0]['amount']:,.2f} USD to {anomaly_txs[0]['destination_country']}).",
                "severity": "MEDIUM"
            })

            # Event 3: Geographic & Anomaly Escalation
            if len(anomaly_txs) > 1:
                timeline.append({
                    "step": 3,
                    "stage": "Geographic Anomaly Triggered",
                    "date": anomaly_txs[1]['timestamp'][:10],
                    "description": f"Multiple wire transfers routed to offshore non-FATF jurisdiction ({anomaly_txs[1]['destination_country']}).",
                    "severity": "HIGH"
                })

            # Event 4: Risk Score Threshold Cross
            timeline.append({
                "step": 4,
                "stage": "Risk Score Escalation (87/100)",
                "date": anomaly_txs[-1]['timestamp'][:10],
                "description": f"Automated Risk Engine crossed CRITICAL threshold ({risk_data['risk_score']}/100 HIGH). Alert ALT-{customer_id} generated.",
                "severity": "CRITICAL"
            })

            # Event 5: Investigation Recommended
            timeline.append({
                "step": 5,
                "stage": "Investigation Recommended",
                "date": anomaly_txs[-1]['timestamp'][:10],
                "description": "Escalated to Senior Compliance Analyst for SAR filing and account restraint review.",
                "severity": "CRITICAL"
            })

    # Active Investigation Case
    cases = query_db("SELECT * FROM INVESTIGATIONS WHERE customer_id = ?", (customer_id,))

    return {
        "profile": cust,
        "accounts": accounts,
        "risk_summary": risk_data,
        "timeline": timeline,
        "transactions": txs,
        "investigation_case": cases[0] if cases else None
    }

# ----------------------------------------------------
# 4. TRANSACTION EXPLORER MATRIX
# ----------------------------------------------------
@app.get("/api/transactions")
def get_transactions(
    customer_id: Optional[str] = None,
    is_anomaly: Optional[int] = None,
    tx_type: Optional[str] = None,
    limit: int = 100
):
    where_clauses = []
    params = []

    if customer_id:
        where_clauses.append("customer_id = ?")
        params.append(customer_id)
    if is_anomaly is not None:
        where_clauses.append("is_anomaly = ?")
        params.append(is_anomaly)
    if tx_type and tx_type != "ALL":
        where_clauses.append("transaction_type = ?")
        params.append(tx_type)

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    query = f"SELECT * FROM TRANSACTIONS {where_sql} ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    return query_db(query, tuple(params))

# ----------------------------------------------------
# 5. AI COPILOT QUERY API
# ----------------------------------------------------
@app.post("/api/copilot/query")
def copilot_query(req: CopilotRequest):
    return process_copilot_query(req.query, req.customer_id or "C102")

# ----------------------------------------------------
# 6. REGULATORY INTELLIGENCE API
# ----------------------------------------------------
@app.post("/api/regulatory/search")
def regulatory_search(req: RegulatorySearchRequest):
    return rag_engine.answer_query(req.query)

@app.get("/api/regulatory/documents")
def get_regulatory_documents():
    return query_db("SELECT doc_id, title, category, issuing_authority, effective_date FROM REGULATORY_DOCUMENTS")

# ----------------------------------------------------
# 7. REPORT GENERATION & DOWNLOAD
# ----------------------------------------------------
@app.post("/api/reports/generate")
def create_report(req: ReportGenerateRequest):
    result = generate_pdf_report(req.customer_id, req.analyst_name)
    return result

@app.get("/api/reports/download/{filename}")
def download_report(filename: str):
    file_path = os.path.join(REPORTS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report PDF file not found")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

@app.get("/api/reports")
def list_reports():
    return query_db("SELECT * FROM INVESTIGATION_REPORTS ORDER BY created_at DESC")
