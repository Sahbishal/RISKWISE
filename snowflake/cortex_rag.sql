-- RISKWISE: Snowflake Cortex AI Integration & Search Setup
-- Demonstrates Cortex Vector Search, Cortex LLM complete(), and Embeddings

USE DATABASE RISKWISE_DB;
USE SCHEMA PUBLIC;

-- 1. Create Cortex Search Service over Regulatory Documents (if running in Snowflake Cortex region)
-- CREATE OR REPLACE CORTEX SEARCH SERVICE REGULATORY_SEARCH_SERVICE
-- ON content
-- ATTRIBUTES category, title, issuing_authority
-- WAREHOUSE = COMPUTE_WH
-- TARGET_LAG = '1 hour'
-- AS (
--     SELECT doc_id, title, category, issuing_authority, effective_date, content
--     FROM REGULATORY_DOCUMENTS
-- );

-- 2. Cortex Vector Search & Embedding helper view
CREATE OR REPLACE VIEW REGULATORY_EMBEDDINGS_V AS
SELECT 
    doc_id,
    title,
    category,
    content,
    SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', content) AS doc_vector
FROM REGULATORY_DOCUMENTS;

-- 3. Stored Procedure for Grounded Regulatory Query using Cortex Complete
CREATE OR REPLACE PROCEDURE GROUNDED_REGULATORY_QUERY(user_prompt STRING)
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-snowpark-python')
HANDLER = 'query_handler'
AS
$$
def query_handler(session, user_prompt):
    # Retrieve top relevant regulatory snippets using cosine vector distance
    query_sql = f"""
        SELECT title, category, content, 
               VECTOR_COSINE_SIMILARITY(
                   SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', '{user_prompt}'), 
                   SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', content)
               ) as similarity
        FROM REGULATORY_DOCUMENTS
        ORDER BY similarity DESC
        LIMIT 3
    """
    results = session.sql(query_sql).collect()
    
    if not results:
        return "No supporting evidence was found in the available regulatory knowledge base."
        
    context = "\n---\n".join([f"Document: {r['TITLE']}\nCategory: {r['CATEGORY']}\nExcerpt: {r['CONTENT']}" for r in results])
    
    prompt = f"""You are an enterprise Risk & Compliance AI Copilot. Answer the analyst's question strictly based on the following regulatory evidence.
Always cite the source document and section.

Question: {user_prompt}

Regulatory Evidence:
{context}

Answer structure:
ANSWER: <detailed answer>
SOURCE DOCUMENT: <document title>
RELEVANT SECTION: <category/section>
EVIDENCE/CITATION: <exact quote or summary>
"""
    
    llm_sql = f"SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '{prompt.replace(\"'\", \"''\")}') AS ANSWER"
    response = session.sql(llm_sql).collect()
    return response[0]['ANSWER']
$$;
