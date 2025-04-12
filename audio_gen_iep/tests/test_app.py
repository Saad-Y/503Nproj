import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from ..app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@patch("audio_gen_iep.app.client.audio.speech.with_streaming_response.create")
def test_synthesize_success(mock_create, client):
    # Mock the context manager and stream_to_file behavior
    mock_stream = MagicMock()
    mock_create.return_value.__enter__.return_value = mock_stream

    response = client.get("/synthesize")

    # Assert that the streaming call was made
    mock_stream.stream_to_file.assert_called_once()

    # Assert the response is an mp3 file download
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "audio/mpeg"
    assert "attachment; filename=speech.mp3" in response.headers["Content-Disposition"]

def test_synthesize_method_not_allowed(client):
    response = client.post("/synthesize")  # Only GET is allowed
    assert response.status_code == 405
