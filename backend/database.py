import os
import sqlite3
import pandas as pd
from typing import Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "riskwise.db")

SNOWFLAKE_ACCOUNT = os.getenv("SNOWFLAKE_ACCOUNT")
SNOWFLAKE_USER = os.getenv("SNOWFLAKE_USER")
SNOWFLAKE_PASSWORD = os.getenv("SNOWFLAKE_PASSWORD")
SNOWFLAKE_DATABASE = os.getenv("SNOWFLAKE_DATABASE", "RISKWISE_DB")
SNOWFLAKE_SCHEMA = os.getenv("SNOWFLAKE_SCHEMA", "PUBLIC")

def get_connection():
    """
    Dual Data Engine Connection Helper.
    If Snowflake credentials are configured in environment variables, connects to Snowflake.
    Otherwise, defaults to high-performance local SQLite enterprise engine.
    """
    if SNOWFLAKE_ACCOUNT and SNOWFLAKE_USER and SNOWFLAKE_PASSWORD:
        try:
            import snowflake.connector
            conn = snowflake.connector.connect(
                user=SNOWFLAKE_USER,
                password=SNOWFLAKE_PASSWORD,
                account=SNOWFLAKE_ACCOUNT,
                database=SNOWFLAKE_DATABASE,
                schema=SNOWFLAKE_SCHEMA
            )
            return conn, "SNOWFLAKE"
        except Exception as e:
            print(f"[WARNING] Snowflake connection failed, falling back to local database: {e}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn, "SQLITE"

def query_db(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn, db_type = get_connection()
    try:
        if db_type == "SNOWFLAKE":
            cursor = conn.cursor(snowflake.connector.DictCursor)
            cursor.execute(query, params)
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            return [dict(row) for row in rows]
        else:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            result = [dict(row) for row in rows]
            cursor.close()
            conn.close()
            return result
    except Exception as e:
        print(f"[ERROR] Query failed: {query} | Error: {e}")
        if conn:
            conn.close()
        return []

def query_df(query: str, params: tuple = ()) -> pd.DataFrame:
    conn, db_type = get_connection()
    try:
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        return df
    except Exception as e:
        print(f"[ERROR] query_df failed: {e}")
        if conn:
            conn.close()
        return pd.DataFrame()
