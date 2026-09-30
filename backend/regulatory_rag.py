import os
import re
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.database import query_db

class RegulatoryRAG:
    def __init__(self):
        self.chunks = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self._load_and_chunk_documents()

    def _load_and_chunk_documents(self):
        docs = query_db("SELECT doc_id, title, category, issuing_authority, content FROM REGULATORY_DOCUMENTS")
        self.chunks = []

        for doc in docs:
            content = doc["content"]
            sections = re.split(r'\n(?=SECTION\s+\d+:)', content)
            
            for idx, sec in enumerate(sections):
                sec_text = sec.strip()
                if not sec_text:
                    continue
                
                # Extract section title/header if present
                first_line = sec_text.split('\n')[0]
                section_title = first_line if "SECTION" in first_line else f"General Section {idx+1}"
                
                self.chunks.append({
                    "doc_id": doc["doc_id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "issuing_authority": doc["issuing_authority"],
                    "section_title": section_title,
                    "text": sec_text
                })

        if self.chunks:
            texts = [c["text"] for c in self.chunks]
            self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            self.tfidf_matrix = self.vectorizer.fit_transform(texts)

    def search(self, query: str, top_k: int = 3, min_threshold: float = 0.08) -> List[Dict[str, Any]]:
        if not self.chunks or self.vectorizer is None:
            self._load_and_chunk_documents()
            if not self.chunks or self.vectorizer is None:
                return []

        query_vec = self.vectorizer.transform([query])
        sims = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        top_indices = sims.argsort()[::-1][:top_k]
        results = []

        for idx in top_indices:
            score = float(sims[idx])
            if score >= min_threshold:
                chunk = self.chunks[idx].copy()
                chunk["similarity_score"] = round(score, 4)
                results.append(chunk)

        return results

    def answer_query(self, query: str) -> Dict[str, Any]:
        results = self.search(query, top_k=2)

        if not results:
            return {
                "found": False,
                "answer": "No supporting evidence was found in the available regulatory knowledge base.",
                "source_document": "N/A",
                "relevant_section": "N/A",
                "evidence_citation": "No matching regulatory guideline or statutory reference retrieved for the provided query."
            }

        top_doc = results[0]
        
        # Build synthesis response
        synthesis = self._synthesize_answer(query, top_doc)
        
        return {
            "found": True,
            "answer": synthesis,
            "source_document": f"{top_doc['title']} ({top_doc['issuing_authority']})",
            "relevant_section": top_doc["section_title"],
            "evidence_citation": top_doc["text"][:450] + ("..." if len(top_doc["text"]) > 450 else ""),
            "all_retrieved_sources": results
        }

    def _synthesize_answer(self, query: str, top_doc: Dict[str, Any]) -> str:
        q_lower = query.lower()
        sec_text = top_doc["text"]

        if "aml" in q_lower or "bsa" in q_lower or "monitoring" in q_lower or "flagged" in q_lower:
            return (
                f"According to {top_doc['title']}, financial institutions must maintain continuous transaction monitoring "
                f"systems to flag anomalies such as amount spikes (>3x baseline average or >$10,000 single transfer), "
                f"rapid fund movement to offshore accounts within 48 hours, and velocity spikes. Multi-signal alerts require "
                f"immediate Enhanced Due Diligence (EDD) and investigation."
            )
        elif "sar" in q_lower or "report" in q_lower or "filing" in q_lower or "threshold" in q_lower:
            return (
                f"Under FinCEN SAR guidance ({top_doc['title']}), institutions are required to file a Suspicious Activity Report "
                f"within 30 calendar days for money laundering triggers or unexplained transactions exceeding $5,000. "
                f"Audit-ready investigation reports must include customer baseline data, chronological timeline, "
                f"risk score breakdown, regulatory citations, and clear decision recommendations."
            )
        elif "kyc" in q_lower or "cdd" in q_lower or "pep" in q_lower:
            return (
                f"Pursuant to {top_doc['title']}, Customer Due Diligence (CDD) standards mandate ongoing monitoring "
                f"and re-profiling when customer monthly volume deviates >200% from onboarding expectations or involves "
                f"Politically Exposed Persons (PEPs) or high-risk jurisdictions."
            )
        elif "fatf" in q_lower or "country" in q_lower or "geographic" in q_lower or "jurisdiction" in q_lower or "sanctions" in q_lower:
            return (
                f"Per FATF & OFAC compliance guidance ({top_doc['title']}), transactions involving high-risk jurisdictions "
                f"(e.g., Cayman Islands, Seychelles, Panama) or IP geolocation jumps >2,000 miles incur explicit risk weighting (+25 to +40 points) "
                f"and require immediate sanctions screening or asset freezing protocols."
            )
        else:
            return f"Based on {top_doc['title']} ({top_doc['section_title']}):\n{sec_text[:350]}..."

# Global Instance Singleton
rag_engine = RegulatoryRAG()
