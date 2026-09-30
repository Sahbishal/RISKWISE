import os
import sqlite3
import random
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "riskwise.db")
REG_DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "regulatory_docs")

def init_db(conn):
    cursor = conn.cursor()
    
    # 1. CUSTOMERS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS CUSTOMERS (
        customer_id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        country TEXT,
        risk_rating TEXT,
        customer_since TEXT,
        occupation TEXT,
        annual_income REAL,
        kyc_status TEXT,
        pep_flag INTEGER DEFAULT 0,
        created_at TEXT
    );
    """)

    # 2. ACCOUNTS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ACCOUNTS (
        account_id TEXT PRIMARY KEY,
        customer_id TEXT,
        account_type TEXT,
        currency TEXT DEFAULT 'USD',
        balance REAL,
        account_status TEXT,
        opened_date TEXT,
        created_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id)
    );
    """)

    # 3. TRANSACTIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS TRANSACTIONS (
        transaction_id TEXT PRIMARY KEY,
        account_id TEXT,
        customer_id TEXT,
        amount REAL,
        currency TEXT DEFAULT 'USD',
        transaction_type TEXT,
        merchant_name TEXT,
        merchant_category TEXT,
        origin_country TEXT,
        destination_country TEXT,
        device_id TEXT,
        ip_address TEXT,
        timestamp TEXT,
        status TEXT,
        is_anomaly INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (account_id) REFERENCES ACCOUNTS(account_id),
        FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id)
    );
    """)

    # 4. RISK_ALERTS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS RISK_ALERTS (
        alert_id TEXT PRIMARY KEY,
        customer_id TEXT,
        transaction_id TEXT,
        risk_score REAL,
        risk_level TEXT,
        primary_risk_signal TEXT,
        status TEXT,
        alert_date TEXT,
        created_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id),
        FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id)
    );
    """)

    # 5. RISK_SIGNALS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS RISK_SIGNALS (
        signal_id TEXT PRIMARY KEY,
        alert_id TEXT,
        customer_id TEXT,
        signal_type TEXT,
        severity TEXT,
        contribution_score REAL,
        evidence_summary TEXT,
        created_at TEXT,
        FOREIGN KEY (alert_id) REFERENCES RISK_ALERTS(alert_id),
        FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id)
    );
    """)

    # 6. INVESTIGATIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS INVESTIGATIONS (
        case_id TEXT PRIMARY KEY,
        alert_id TEXT,
        customer_id TEXT,
        assigned_analyst TEXT,
        investigation_status TEXT,
        summary TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (alert_id) REFERENCES RISK_ALERTS(alert_id),
        FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id)
    );
    """)

    # 7. REGULATORY_DOCUMENTS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS REGULATORY_DOCUMENTS (
        doc_id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT,
        issuing_authority TEXT,
        effective_date TEXT,
        content TEXT,
        created_at TEXT
    );
    """)

    # 8. INVESTIGATION_REPORTS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS INVESTIGATION_REPORTS (
        report_id TEXT PRIMARY KEY,
        case_id TEXT,
        customer_id TEXT,
        generated_by TEXT,
        report_data TEXT,
        created_at TEXT,
        FOREIGN KEY (case_id) REFERENCES INVESTIGATIONS(case_id),
        FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id)
    );
    """)
    conn.commit()

def generate_data():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cursor = conn.cursor()

    random.seed(42)
    now = datetime.now()

    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
    countries = ["United States", "United Kingdom", "Canada", "Germany", "France", "Japan", "Australia", "Singapore", "Switzerland", "United Arab Emirates"]
    high_risk_countries = ["Cayman Islands", "Seychelles", "Panama", "British Virgin Islands", "Latvia", "Cyprus", "Malta"]
    occupations = ["Software Engineer", "Accountant", "Business Owner", "Consultant", "Doctor", "Attorney", "Manager", "Financial Analyst", "Architect", "Executive"]
    merchants = ["Amazon Prime", "Global Trade Corp", "Apex Technologies", "Starbucks Coffee", "Uber Rides", "Delta Air Lines", "Luxury Goods Int", "Quick Pay Transfer", "Offshore Wire Services", "Crypto Exchange Global"]
    merchant_cats = ["Retail", "Corporate Services", "Electronics", "Food & Beverage", "Transportation", "Travel", "Luxury Goods", "Peer-to-Peer", "Financial Services", "Cryptocurrency"]

    customers = []
    accounts = []
    transactions = []
    risk_alerts = []
    risk_signals = []
    investigations = []

    # ----------------------------------------------------
    # 1. SPECIFIC HERO DEMO CASE: Customer C102
    # ----------------------------------------------------
    c102_id = "C102"
    c102_cust = (
        c102_id,
        "Alexander",
        "Vance",
        "alexander.vance@enterprise-corp.com",
        "+1-555-019-4821",
        "United States",
        "HIGH",
        "2021-03-15",
        "Import/Export Specialist",
        145000.00,
        "VERIFIED",
        0,
        (now - timedelta(days=90)).strftime("%Y-%m-%d %H:%M:%S")
    )
    customers.append(c102_cust)

    c102_acc_id = "ACC-C102-01"
    c102_acc = (
        c102_acc_id,
        c102_id,
        "CHECKING",
        "USD",
        248500.00,
        "ACTIVE",
        "2021-03-15",
        (now - timedelta(days=90)).strftime("%Y-%m-%d %H:%M:%S")
    )
    accounts.append(c102_acc)

    # C102 Baseline Transactions (Days -90 to -6)
    c102_tx_count = 0
    for day in range(90, 6, -1):
        if day % 2 == 0:
            tx_time = now - timedelta(days=day, hours=random.randint(8, 18), minutes=random.randint(0, 59))
            c102_tx_count += 1
            tx_id = f"TX-C102-BASE-{c102_tx_count:04d}"
            amt = round(random.uniform(45.0, 350.0), 2)
            transactions.append((
                tx_id, c102_acc_id, c102_id, amt, "USD", "POS",
                random.choice(["Starbucks", "Target", "Shell Gas", "Whole Foods"]),
                "Retail", "United States", "United States",
                "DEV-C102-US", "192.168.1.102",
                tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                "COMPLETED", 0, tx_time.strftime("%Y-%m-%d %H:%M:%S")
            ))

    # C102 Anomaly Cluster (Days -5 to -1) -> Rapid high-value wire transfers to Cayman Islands
    anomaly_events = [
        (-4, 18500.00, "WIRE_TRANSFER", "Offshore Capital Partners", "Financial Services", "United States", "Cayman Islands", "Rapid high-value international wire transfer"),
        (-3, 42000.00, "WIRE_TRANSFER", "Global Shell Investments", "Corporate Services", "United States", "Cayman Islands", "Abnormal amount spike far exceeding historical average"),
        (-2, 38500.00, "WIRE_TRANSFER", "Vanguard Offshore Custody", "Financial Services", "United States", "Seychelles", "Geographic anomaly & velocity spike"),
        (-1, 55000.00, "WIRE_TRANSFER", "Apex Global Clearing", "Peer-to-Peer", "United States", "Cayman Islands", "Critical funds pass-through activity")
    ]

    c102_alert_id = "ALT-C102-87"
    c102_flagged_tx_id = "TX-C102-ANOM-0004"

    for idx, (days_ago, amt, tx_type, merch, mcat, orig, dest, desc) in enumerate(anomaly_events, start=1):
        tx_time = now - timedelta(days=days_ago, hours=random.randint(10, 16))
        tx_id = f"TX-C102-ANOM-{idx:04d}"
        transactions.append((
            tx_id, c102_acc_id, c102_id, amt, "USD", tx_type,
            merch, mcat, orig, dest,
            "DEV-C102-FOREIGN", "185.220.101.5",
            tx_time.strftime("%Y-%m-%d %H:%M:%S"),
            "FLAGGED" if idx >= 3 else "COMPLETED",
            1, tx_time.strftime("%Y-%m-%d %H:%M:%S")
        ))

    # C102 Alert & Signals
    risk_alerts.append((
        c102_alert_id,
        c102_id,
        c102_flagged_tx_id,
        87.50,
        "HIGH",
        "Multi-Vector Anomaly: Amount Spike, Geo Anomaly, & Rapid Funds Movement",
        "UNDER_INVESTIGATION",
        (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
        (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
    ))

    c102_signals = [
        ("SIG-C102-01", c102_alert_id, c102_id, "AMOUNT_ANOMALY", "CRITICAL", 35.0, "Transaction amount $55,000 is 157x higher than historical 90-day baseline average ($350)."),
        ("SIG-C102-02", c102_alert_id, c102_id, "GEO_ANOMALY", "HIGH", 25.0, "Wire transfers routed to Cayman Islands & Seychelles from domestic US checking account."),
        ("SIG-C102-03", c102_alert_id, c102_id, "FREQUENCY_SPIKE", "HIGH", 17.5, "4 high-value international wire transfers executed within 72 hours."),
        ("SIG-C102-04", c102_alert_id, c102_id, "RAPID_FUNDS_MOVEMENT", "MEDIUM", 10.0, "Pass-through velocity: 92% of account balance drained to offshore entities within 4 days.")
    ]
    for sig in c102_signals:
        risk_signals.append((
            sig[0], sig[1], sig[2], sig[3], sig[4], sig[5], sig[6],
            (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        ))

    investigations.append((
        "CASE-C102-2024",
        c102_alert_id,
        c102_id,
        "Sarah Jenkins (Senior AML Specialist)",
        "IN_PROGRESS",
        "Customer C102 (Alexander Vance) exhibited sudden severe multi-vector transactional anomalies starting 5 days ago. Cumulative transfers exceed $154,000 to high-risk offshore entities in the Cayman Islands. Escalated for full SAR review and regulatory compliance analysis.",
        (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
        now.strftime("%Y-%m-%d %H:%M:%S")
    ))

    # ----------------------------------------------------
    # 2. GENERATE 1,000+ SYNTHETIC CUSTOMERS & ACCOUNTS
    # ----------------------------------------------------
    print("Generating 1,000+ synthetic customers...")
    for i in range(1001, 2021):
        cid = f"C{i}"
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
        phone = f"+1-555-{random.randint(100,999):03d}-{random.randint(1000,9999):04d}"
        country = random.choice(countries)
        since = (now - timedelta(days=random.randint(100, 1500))).strftime("%Y-%m-%d")
        occ = random.choice(occupations)
        income = round(random.uniform(45000, 250000), 2)
        kyc = random.choice(["VERIFIED", "VERIFIED", "VERIFIED", "PENDING"])
        pep = 1 if random.random() < 0.02 else 0

        # Assign risk rating (mostly LOW, some MEDIUM, few HIGH)
        rand_val = random.random()
        if rand_val < 0.85:
            rating = "LOW"
        elif rand_val < 0.95:
            rating = "MEDIUM"
        else:
            rating = "HIGH"

        customers.append((
            cid, fn, ln, email, phone, country, rating, since, occ, income, kyc, pep,
            now.strftime("%Y-%m-%d %H:%M:%S")
        ))

        # 1-2 accounts per customer
        acc_types = ["CHECKING", "SAVINGS"]
        for a_idx in range(random.randint(1, 2)):
            acc_id = f"ACC-{cid}-{a_idx+1:02d}"
            bal = round(random.uniform(1500, 120000), 2)
            accounts.append((
                acc_id, cid, acc_types[a_idx % len(acc_types)], "USD", bal, "ACTIVE", since,
                now.strftime("%Y-%m-%d %H:%M:%S")
            ))

    # ----------------------------------------------------
    # 3. GENERATE 20,000+ SYNTHETIC TRANSACTIONS
    # ----------------------------------------------------
    print("Generating 20,000+ synthetic transactions...")
    tx_types = ["WIRE_TRANSFER", "ATM_WITHDRAWAL", "ONLINE_PAYMENT", "POS", "CRYPTO_PURCHASE"]

    # Map accounts by customer
    cust_acc_map = {}
    for acc in accounts:
        cid = acc[1]
        if cid not in cust_acc_map:
            cust_acc_map[cid] = []
        cust_acc_map[cid].append(acc[0])

    tx_counter = 0
    # Distribute ~20,000 transactions across customers over last 90 days
    alert_counter = 1
    
    for cust in customers:
        cid = cust[0]
        if cid == c102_id:
            continue # already generated C102 custom workflow
            
        rating = cust[6]
        acc_ids = cust_acc_map.get(cid, [])
        if not acc_ids:
            continue
            
        # Determine number of transactions
        num_tx = random.randint(15, 25)

        for _ in range(num_tx):
            tx_counter += 1
            tx_id = f"TX-{tx_counter:06d}"
            acc_id = random.choice(acc_ids)
            days_ago = random.randint(0, 90)
            tx_time = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            is_anom = 0
            status = "COMPLETED"
            orig = cust[5]
            dest = orig
            amt = round(random.uniform(10.0, 1200.0), 2)
            ttype = random.choice(tx_types)
            merch = random.choice(merchants)
            mcat = random.choice(merchant_cats)

            # Generate occasional suspicious alerts based on risk rating
            if rating == "HIGH" and random.random() < 0.25:
                is_anom = 1
                status = "FLAGGED"
                amt = round(random.uniform(8500.0, 48000.0), 2)
                dest = random.choice(high_risk_countries)
                ttype = "WIRE_TRANSFER"
            elif rating == "MEDIUM" and random.random() < 0.08:
                is_anom = 1
                status = "FLAGGED"
                amt = round(random.uniform(4500.0, 18000.0), 2)

            transactions.append((
                tx_id, acc_id, cid, amt, "USD", ttype, merch, mcat, orig, dest,
                f"DEV-{cid}", f"172.16.{random.randint(1,254)}.{random.randint(1,254)}",
                tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                status, is_anom, tx_time.strftime("%Y-%m-%d %H:%M:%S")
            ))

            # Create Risk Alert for anomalous transactions
            if is_anom and len(risk_alerts) < 120:
                alert_counter += 1
                alt_id = f"ALT-{alert_counter:04d}"
                score = round(random.uniform(72.0, 96.0) if rating == "HIGH" else random.uniform(45.0, 69.0), 2)
                lvel = "HIGH" if score >= 70 else "MEDIUM"
                signal = random.choice([
                    "Unusually High Transaction Amount",
                    "Geographic Anomaly / High-Risk Destination",
                    "Sudden Increase in Transaction Frequency",
                    "Rapid Movement of Funds"
                ])
                astatus = random.choice(["OPEN", "UNDER_INVESTIGATION", "RESOLVED_FALSE_POSITIVE"])

                risk_alerts.append((
                    alt_id, cid, tx_id, score, lvel, signal, astatus,
                    tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                    tx_time.strftime("%Y-%m-%d %H:%M:%S")
                ))

                # Attached signal
                sig_id = f"SIG-{alert_counter:04d}-01"
                risk_signals.append((
                    sig_id, alt_id, cid, "AMOUNT_ANOMALY" if "Amount" in signal else "GEO_ANOMALY",
                    lvel, round(score * 0.4, 2), f"Flagged signal for {cid}: {signal}",
                    tx_time.strftime("%Y-%m-%d %H:%M:%S")
                ))

    # ----------------------------------------------------
    # 4. LOAD REGULATORY DOCUMENTS FROM REGULATORY_DOCS/
    # ----------------------------------------------------
    print("Loading regulatory documents into database...")
    reg_docs = []
    if os.path.exists(REG_DOCS_DIR):
        for fname in os.listdir(REG_DOCS_DIR):
            if fname.endswith(".txt"):
                fpath = os.path.join(REG_DOCS_DIR, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()

                doc_id = f"DOC-{fname.split('.')[0].upper()}"
                title_line = [line for line in content.split("\n") if "REGULATORY DOCUMENT:" in line]
                title = title_line[0].replace("REGULATORY DOCUMENT:", "").strip() if title_line else fname
                
                cat_line = [line for line in content.split("\n") if "CATEGORY:" in line]
                cat = cat_line[0].replace("CATEGORY:", "").strip() if cat_line else "COMPLIANCE"

                auth_line = [line for line in content.split("\n") if "ISSUING AUTHORITY:" in line]
                auth = auth_line[0].replace("ISSUING AUTHORITY:", "").strip() if auth_line else "Regulatory Agency"

                reg_docs.append((
                    doc_id, title, cat, auth, "2024-01-01", content,
                    now.strftime("%Y-%m-%d %H:%M:%S")
                ))

    # Bulk insert into SQLite
    print("Inserting data into SQLite tables...")
    cursor.executemany("INSERT INTO CUSTOMERS VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", customers)
    cursor.executemany("INSERT INTO ACCOUNTS VALUES (?,?,?,?,?,?,?,?)", accounts)
    cursor.executemany("INSERT INTO TRANSACTIONS VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", transactions)
    cursor.executemany("INSERT INTO RISK_ALERTS VALUES (?,?,?,?,?,?,?,?,?)", risk_alerts)
    cursor.executemany("INSERT INTO RISK_SIGNALS VALUES (?,?,?,?,?,?,?,?)", risk_signals)
    cursor.executemany("INSERT INTO INVESTIGATIONS VALUES (?,?,?,?,?,?,?,?)", investigations)
    cursor.executemany("INSERT INTO REGULATORY_DOCUMENTS VALUES (?,?,?,?,?,?,?)", reg_docs)

    conn.commit()
    conn.close()

    print(f"SUCCESS: Generated {len(customers)} customers, {len(accounts)} accounts, {len(transactions)} transactions, {len(risk_alerts)} risk alerts, and {len(reg_docs)} regulatory docs.")

if __name__ == "__main__":
    generate_data()
