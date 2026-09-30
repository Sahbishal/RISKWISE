import numpy as np
import pandas as pd
from typing import Dict, Any, List
from backend.database import query_db, query_df

def calculate_customer_risk_score(customer_id: str) -> Dict[str, Any]:
    """
    Explainable Risk & Fraud Scoring Model.
    Decomposes risk score into 5 key transparent factors:
    1. Amount Anomaly (Max +35)
    2. Geographic Anomaly (Max +25)
    3. Frequency Anomaly (Max +20)
    4. Rapid Movement of Funds / Velocity (Max +10)
    5. High-Risk Profile / PEP Status (Max +10)
    
    Final Risk Score normalized 0 - 100.
    """
    # Fetch Customer Profile
    cust_rows = query_db("SELECT * FROM CUSTOMERS WHERE customer_id = ?", (customer_id,))
    if not cust_rows:
        return {"error": "Customer not found"}
    
    cust = cust_rows[0]
    
    # Fetch Customer Transactions
    tx_df = query_df("SELECT * FROM TRANSACTIONS WHERE customer_id = ? ORDER BY timestamp DESC", (customer_id,))
    
    if tx_df.empty:
        return {
            "customer_id": customer_id,
            "risk_score": 0.0,
            "risk_level": "LOW",
            "factors": []
        }
    
    # Baseline calculations (older transactions vs recent 7 days)
    tx_df['timestamp'] = pd.to_datetime(tx_df['timestamp'])
    max_date = tx_df['timestamp'].max()
    recent_cutoff = max_date - pd.Timedelta(days=7)
    
    baseline_tx = tx_df[tx_df['timestamp'] < recent_cutoff]
    recent_tx = tx_df[tx_df['timestamp'] >= recent_cutoff]
    
    baseline_avg_amt = baseline_tx['amount'].mean() if not baseline_tx.empty and baseline_tx['amount'].mean() > 0 else 150.0
    recent_max_amt = recent_tx['amount'].max() if not recent_tx.empty else 0.0
    recent_count = len(recent_tx)
    baseline_freq_per_week = len(baseline_tx) / max(1.0, (max_date - tx_df['timestamp'].min()).days / 7.0)
    
    factors = []
    
    # 1. AMOUNT ANOMALY SCORE (Max 35)
    amount_ratio = recent_max_amt / max(10.0, baseline_avg_amt)
    if amount_ratio >= 10.0:
        amt_score = 35.0
        amt_sev = "CRITICAL"
        amt_desc = f"Max recent transaction (${recent_max_amt:,.2f}) is {amount_ratio:.1f}x higher than 90-day baseline average (${baseline_avg_amt:,.2f})."
    elif amount_ratio >= 4.0:
        amt_score = 22.5
        amt_sev = "HIGH"
        amt_desc = f"Max recent transaction (${recent_max_amt:,.2f}) is {amount_ratio:.1f}x higher than baseline average."
    elif amount_ratio >= 2.0:
        amt_score = 12.0
        amt_sev = "MEDIUM"
        amt_desc = f"Moderate amount elevation detected ({amount_ratio:.1f}x baseline)."
    else:
        amt_score = 0.0
        amt_sev = "LOW"
        amt_desc = "Transaction amounts remain within expected historical variance."
        
    factors.append({
        "factor_type": "AMOUNT_ANOMALY",
        "name": "Amount Anomaly",
        "contribution": round(amt_score, 1),
        "max_possible": 35.0,
        "severity": amt_sev,
        "evidence": amt_desc
    })
    
    # 2. GEOGRAPHIC ANOMALY SCORE (Max 25)
    high_risk_jurisdictions = ["Cayman Islands", "Seychelles", "Panama", "British Virgin Islands", "Latvia", "Cyprus", "Malta"]
    geo_matches = recent_tx[recent_tx['destination_country'].isin(high_risk_jurisdictions)]
    
    if not geo_matches.empty:
        geo_score = 25.0
        geo_sev = "HIGH"
        dest_countries = ", ".join(geo_matches['destination_country'].unique())
        geo_desc = f"Detected {len(geo_matches)} wire transfers to high-risk jurisdiction(s): {dest_countries}."
    else:
        foreign_tx = recent_tx[recent_tx['destination_country'] != cust['country']]
        if not foreign_tx.empty:
            geo_score = 12.5
            geo_sev = "MEDIUM"
            geo_desc = f"Cross-border transactions originating from {cust['country']} to {foreign_tx['destination_country'].iloc[0]}."
        else:
            geo_score = 0.0
            geo_sev = "LOW"
            geo_desc = "All transactions originated and completed domestically."
            
    factors.append({
        "factor_type": "GEO_ANOMALY",
        "name": "Geographic Anomaly",
        "contribution": round(geo_score, 1),
        "max_possible": 25.0,
        "severity": geo_sev,
        "evidence": geo_desc
    })
    
    # 3. FREQUENCY / VELOCITY SPIKE (Max 20)
    freq_ratio = recent_count / max(1.0, baseline_freq_per_week)
    if recent_count >= 4 and freq_ratio >= 2.5:
        freq_score = 20.0
        freq_sev = "HIGH"
        freq_desc = f"Sudden transaction velocity spike: {recent_count} transactions in recent window ({freq_ratio:.1f}x weekly average)."
    elif freq_ratio >= 1.5:
        freq_score = 10.0
        freq_sev = "MEDIUM"
        freq_desc = f"Elevated weekly transaction frequency ({recent_count} txs vs {baseline_freq_per_week:.1f} baseline)."
    else:
        freq_score = 0.0
        freq_sev = "LOW"
        freq_desc = "Transaction frequency aligns with historical baseline."
        
    factors.append({
        "factor_type": "FREQUENCY_SPIKE",
        "name": "Frequency Spike",
        "contribution": round(freq_score, 1),
        "max_possible": 20.0,
        "severity": freq_sev,
        "evidence": freq_desc
    })
    
    # 4. RAPID MOVEMENT OF FUNDS / PASS-THROUGH (Max 10)
    recent_wire_sum = recent_tx[recent_tx['transaction_type'] == 'WIRE_TRANSFER']['amount'].sum()
    if recent_wire_sum > 25000.0:
        pass_score = 10.0
        pass_sev = "MEDIUM"
        pass_desc = f"High velocity pass-through transfer pattern totaling ${recent_wire_sum:,.2f} within 7 days."
    else:
        pass_score = 0.0
        pass_sev = "LOW"
        pass_desc = "No high-velocity pass-through flow detected."
        
    factors.append({
        "factor_type": "RAPID_FUNDS_MOVEMENT",
        "name": "Rapid Movement of Funds",
        "contribution": round(pass_score, 1),
        "max_possible": 10.0,
        "severity": pass_sev,
        "evidence": pass_desc
    })
    
    # 5. PROFILE & PEP RISK (Max 10)
    pep_flag = cust.get('pep_flag', 0)
    kyc_status = cust.get('kyc_status', 'VERIFIED')
    
    profile_score = 0.0
    if pep_flag:
        profile_score += 7.0
    if kyc_status != 'VERIFIED':
        profile_score += 3.0
        
    factors.append({
        "factor_type": "PROFILE_RISK",
        "name": "Profile & PEP Risk",
        "contribution": round(profile_score, 1),
        "max_possible": 10.0,
        "severity": "HIGH" if profile_score >= 7.0 else ("MEDIUM" if profile_score > 0 else "LOW"),
        "evidence": f"PEP Flag: {'YES' if pep_flag else 'NO'}, KYC Status: {kyc_status}."
    })
    
    # Calculate Total Risk Score
    total_score = min(100.0, sum(f["contribution"] for f in factors))
    
    if total_score >= 70.0:
        risk_level = "HIGH"
    elif total_score >= 40.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
        
    return {
        "customer_id": customer_id,
        "customer_name": f"{cust['first_name']} {cust['last_name']}",
        "risk_score": round(total_score, 1),
        "risk_level": risk_level,
        "factors": factors
    }
