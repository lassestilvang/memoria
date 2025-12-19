import numpy as np
from typing import List, Tuple
import vertexai
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel
import logging
import os

class RAGService:
    def __init__(self, project_id: str, location: str = "us-central1"):
        self.project_id = project_id
        self.location = location
        self.model_name = "text-embedding-004"
        # vertexai.init should be called in the main app
        self.embedding_model = TextEmbeddingModel.from_pretrained(self.model_name)
        
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of strings.
        """
        try:
            inputs = [TextEmbeddingInput(text) for text in texts]
            embeddings = self.embedding_model.get_embeddings(inputs)
            return [e.values for e in embeddings]
        except Exception as e:
            logging.error(f"Error generating embeddings: {e}")
            return []

    def cosine_similarity(self, v1: np.ndarray, v2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two vectors.
        """
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return dot_product / (norm_v1 * norm_v2)

    def serialize_embedding(self, embedding: List[float]) -> bytes:
        return np.array(embedding, dtype=np.float32).tobytes()

    def deserialize_embedding(self, blob: bytes) -> np.ndarray:
        return np.frombuffer(blob, dtype=np.float32)

    def retrieve_relevant(self, query: str, stored_fragments: List[Tuple[str, str, str, bytes]], top_k: int = 5) -> List[Tuple[str, str, str]]:
        """
        Retrieve top_k relevant fragments based on query.
        stored_fragments: List of (category, content, context, embedding_blob)
        """
        if not stored_fragments:
            return []
            
        # 1. Get embedding for the query
        query_embedding = np.array(self.get_embeddings([query])[0])
        
        # 2. Calculate similarities
        similarities = []
        for i, frag in enumerate(stored_fragments):
            cat, content, context, blob = frag
            if blob:
                frag_emb = self.deserialize_embedding(blob)
            else:
                # Fallback if no embedding stored (shouldn't happen with new ones)
                frag_emb = np.array(self.get_embeddings([f"{cat}: {content}"])[0])
            
            sim = self.cosine_similarity(query_embedding, frag_emb)
            similarities.append((sim, (cat, content, context)))
            
        # 3. Sort and return top_k
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in similarities[:top_k]]

# Singleton instance
_rag_instance = None

def get_rag_service() -> RAGService:
    global _rag_instance
    if _rag_instance is None:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        if project_id:
            _rag_instance = RAGService(project_id, location)
        else:
            logging.warning("GOOGLE_CLOUD_PROJECT not set. RAG service will not be available.")
    return _rag_instance
