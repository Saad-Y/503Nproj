import pytest
from ..app import app
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    # Use an in-memory SQLite database for testing
    with app.test_client() as client:
        yield client

def test_generate_embeddings(client):
    # --- Valid input ---
    text = {"text": "Hello world"}
    response = client.post('/generate_embeddings', data=json.dumps(text), content_type='application/json')

    assert response.status_code == 200
    json_data = response.get_json()

    assert "embedding" in json_data
    assert isinstance(json_data["embedding"], list)
    assert len(json_data["embedding"]) > 0

    # --- Missing "text" key ---
    response = client.post('/generate_embeddings', data=json.dumps({}), content_type='application/json')
    assert response.status_code == 400
    assert "error" in response.get_json()

    # --- Empty body ---
    response = client.post('/generate_embeddings', data="", content_type='application/json')
    assert response.status_code == 400

    # --- Invalid JSON ---
    response = client.post('/generate_embeddings', data="not-a-json", content_type='application/json')
    assert response.status_code == 400 or response.status_code == 500  
    # --- Empty string as text ---
    response = client.post('/generate_embeddings', data=json.dumps({"text": ""}), content_type='application/json')
    assert response.status_code == 200 or response.status_code == 400  
    if response.status_code == 200:
        embedding = response.get_json().get("embedding", [])
        assert isinstance(embedding, list)