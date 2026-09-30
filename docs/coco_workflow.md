# Snowflake CoCo CLI Integration & Workflow Guide

## Overview
**Snowflake CoCo** (formerly Cortex Code) is Snowflake's data-native AI coding agent CLI. In **RISKWISE**, Snowflake CoCo CLI is utilized throughout the development lifecycle and live AI operations to:
1. Orchestrate Snowflake database schemas (`CUSTOMERS`, `TRANSACTIONS`, `RISK_ALERTS`).
2. Generate and test explainable risk scoring SQL views and dbt transformation pipelines.
3. Manage Snowflake Cortex Search services and Cortex LLM functions (`SNOWFLAKE.CORTEX.COMPLETE`, `SNOWFLAKE.CORTEX.EMBED_TEXT_768`).
4. Validate data governance, role-based access control (RBAC), and schema lineage.

---

## 1. Natural Language Schema Setup via CoCo CLI

Developers use Snowflake CoCo CLI to declare database structures using natural language prompts grounded in Snowflake best practices:

```bash
# Initialize database & enterprise schema
coco run "Create database RISKWISE_DB with schema PUBLIC. Define tables for CUSTOMERS, ACCOUNTS, TRANSACTIONS, RISK_ALERTS, RISK_SIGNALS, INVESTIGATIONS, REGULATORY_DOCUMENTS, and INVESTIGATION_REPORTS with foreign key constraints."

# Generate optimized Cortex Search Index
coco run "Create a Snowflake Cortex Search Service named REGULATORY_SEARCH_SERVICE on REGULATORY_DOCUMENTS table targeting column 'content' with attributes title, category, issuing_authority."
```

---

## 2. dbt Data Transformation & Anomaly Scoring Models

CoCo CLI assists in generating explainable dbt transformation models for anomaly detection:

### Model: `models/marts/risk_signals_summary.sql`
```sql
{{ config(materialized='table') }}

WITH customer_baselines AS (
    SELECT 
        customer_id,
        AVG(amount) AS baseline_avg_amount,
        STDDEV(amount) AS baseline_std_amount,
        COUNT(*) / 90.0 AS baseline_daily_frequency
    FROM {{ source('riskwise', 'transactions') }}
    WHERE timestamp < DATEADD(day, -7, CURRENT_TIMESTAMP())
    GROUP BY customer_id
),
recent_activity AS (
    SELECT 
        customer_id,
        MAX(amount) AS recent_max_amount,
        COUNT(*) AS recent_weekly_count,
        COUNT(CASE font WHEN destination_country != origin_country THEN 1 END) AS foreign_transfer_count
    FROM {{ source('riskwise', 'transactions') }}
    WHERE timestamp >= DATEADD(day, -7, CURRENT_TIMESTAMP())
    GROUP BY customer_id
)
SELECT 
    r.customer_id,
    b.baseline_avg_amount,
    r.recent_max_amount,
    (r.recent_max_amount / NULLIF(b.baseline_avg_amount, 0)) AS amount_anomaly_ratio,
    CASE 
        WHEN (r.recent_max_amount / NULLIF(b.baseline_avg_amount, 0)) >= 10.0 THEN 35.0
        WHEN (r.recent_max_amount / NULLIF(b.baseline_avg_amount, 0)) >= 4.0 THEN 22.5
        ELSE 0.0 
    END AS amount_anomaly_score
FROM recent_activity r
JOIN customer_baselines b ON r.customer_id = b.customer_id;
```

---

## 3. CoCo CLI Agentic Testing & Evaluation

CoCo CLI enables automated validation of Snowflake Cortex SQL functions:

```bash
# Execute Cortex vector search test
coco run "Execute procedure GROUNDED_REGULATORY_QUERY('What are the BSA AML requirements for rapid movement of funds?') and assert that the response contains source document citations."

# Verify RBAC policy enforcement
coco run "Verify that ANALYST_ROLE has SELECT permissions on RISK_ALERTS and EXECUTE on CORTEX functions while masking customer PII columns."
```

---

## 4. Key Capabilities Demonstrated

| Feature | CoCo CLI Implementation | Enterprise Value |
|---|---|---|
| **Data Interaction** | Natural language SQL generation & schema exploration | Accelerated developer velocity |
| **Agentic Workflow** | Automated dbt model generation & Cortex vector index creation | Governed data pipelines |
| **Context Awareness** | Direct understanding of Snowflake RBAC, schemas & Cortex AI functions | Zero risk of hallucinations on schema structures |
| **Grounded QA** | Orchestration of `CORTEX.EMBED_TEXT_768` and `CORTEX.COMPLETE` | Audit-ready regulatory compliance answers |
