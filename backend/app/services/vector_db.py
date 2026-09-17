import os
import json
import math
import re
from typing import List, Dict, Any

class SimpleVectorStore:
    """
    Lightweight, high-performance Vector DB store for Document Chunk Indexing & Semantic Retrieval.
    Stores document chunks with page metadata and performs vector similarity calculation.
    """
    def __init__(self, bid_id: str):
        self.bid_id = str(bid_id)
        self.chunks: List[Dict[str, Any]] = []

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\w+', text.lower())

    def _get_term_freq(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        if not tokens:
            return {}
        freq = {}
        for token in tokens:
            freq[token] = freq.get(token, 0) + 1
        length = len(tokens)
        return {word: count / length for word, count in freq.items()}

    def add_document_chunks(self, doc_name: str, pages_data: List[Dict[str, Any]], chunk_size: int = 400):
        """Chunk document page texts and add to vector store index."""
        for p_info in pages_data:
            page_num = p_info["page"]
            text = p_info["text"]
            if not text.strip():
                continue
            
            # Divide page into overlapping windows / chunks
            words = text.split()
            step = max(50, chunk_size // 2)
            for i in range(0, len(words), step):
                chunk_words = words[i:i + chunk_size]
                chunk_text = " ".join(chunk_words)
                if len(chunk_text) < 30:
                    continue
                
                tf_vector = self._get_term_freq(chunk_text)
                self.chunks.append({
                    "id": f"{doc_name}_p{page_num}_{i}",
                    "doc_name": doc_name,
                    "page": page_num,
                    "text": chunk_text,
                    "vector": tf_vector
                })

    def search_similar(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Perform vector cosine similarity search for query across document chunks."""
        query_vector = self._get_term_freq(query)
        if not query_vector or not self.chunks:
            return []

        results = []
        query_words = set(query_vector.keys())

        for chunk in self.chunks:
            chunk_vec = chunk["vector"]
            # Compute Dot Product
            dot_product = sum(query_vector[w] * chunk_vec.get(w, 0.0) for w in query_words)
            
            # Compute Vector Norms
            q_norm = math.sqrt(sum(v ** 2 for v in query_vector.values()))
            c_norm = math.sqrt(sum(v ** 2 for v in chunk_vec.values()))
            
            similarity = dot_product / (q_norm * c_norm) if (q_norm * c_norm) > 0 else 0.0

            # Boost exact keyword matches (e.g., turnover numbers, MII, ISO, EMD)
            exact_matches = sum(1 for w in query_words if len(w) > 3 and w in chunk["text"].lower())
            score = similarity + (exact_matches * 0.05)

            results.append({
                "chunk_id": chunk["id"],
                "doc_name": chunk["doc_name"],
                "page": chunk["page"],
                "text": chunk["text"],
                "score": round(score, 4)
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

# Global store registry by bid_id
_VECTOR_STORES: Dict[str, SimpleVectorStore] = {}

def get_vector_store(bid_id: str) -> SimpleVectorStore:
    if str(bid_id) not in _VECTOR_STORES:
        _VECTOR_STORES[str(bid_id)] = SimpleVectorStore(bid_id)
    return _VECTOR_STORES[str(bid_id)]
