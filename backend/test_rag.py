import pytest
import numpy as np
from unittest.mock import MagicMock, patch
from rag_service import RAGService

@pytest.fixture
def rag():
    with patch('vertexai.init'):
        with patch('vertexai.language_models.TextEmbeddingModel.from_pretrained') as mock_model:
            # Mock the embedding model
            mock_inst = MagicMock()
            mock_model.return_value = mock_inst
            service = RAGService(project_id="test-project")
            service.embedding_model = mock_inst
            return service

def test_cosine_similarity(rag):
    v1 = np.array([1, 0, 0])
    v2 = np.array([1, 0, 0])
    assert rag.cosine_similarity(v1, v2) == pytest.approx(1.0)
    
    v3 = np.array([0, 1, 0])
    assert rag.cosine_similarity(v1, v3) == pytest.approx(0.0)

def test_serialization(rag):
    embed = [0.1, 0.2, 0.3]
    serialized = rag.serialize_embedding(embed)
    assert isinstance(serialized, bytes)
    
    deserialized = rag.deserialize_embedding(serialized)
    assert np.array_equal(deserialized, np.array(embed, dtype=np.float32))

def test_retrieve_relevant(rag):
    # Mock embeddings for query and fragments
    rag.get_embeddings = MagicMock(side_effect=[
        [[1.0, 0.0]], # Query embedding
    ])
    
    fragments = [
        ("Cat1", "Content 1", "Ctx 1", rag.serialize_embedding([1.0, 0.0])), # Perfect match
        ("Cat2", "Content 2", "Ctx 2", rag.serialize_embedding([0.0, 1.0])), # No match
    ]
    
    relevant = rag.retrieve_relevant("query", fragments, top_k=1)
    assert len(relevant) == 1
    assert relevant[0][0] == "Cat1"
    assert relevant[0][1] == "Content 1"
