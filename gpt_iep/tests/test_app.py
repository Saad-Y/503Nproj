import pytest
import json
from ..app import app

# A small base64 string representing a 1x1 transparent PNG
DUMMY_IMAGE_BASE64 = (
    "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"
)

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_get_image_description_valid(client):
    payload = {
        "prompt": "What do you see in this image?",
        "images": [DUMMY_IMAGE_BASE64]
    }

    response = client.post(
        "/get_image_description",
        data=json.dumps(payload),
        content_type="application/json"
    )

    assert response.status_code in [200, 500]  # API may error if OpenAI key is not valid or GPT fails

    if response.status_code == 200:
        data = response.get_json()
        assert "response" in data
        assert isinstance(data["response"], str)

    elif response.status_code == 500:
        data = response.get_json()
        assert "error" in data

def test_get_image_description_missing_prompt(client):
    payload = {
        "images": [DUMMY_IMAGE_BASE64]
    }

    response = client.post("/get_image_description", data=json.dumps(payload), content_type="application/json")
    assert response.status_code in [200, 500]

def test_get_image_description_missing_images(client):
    payload = {
        "prompt": "No image here."
    }

    response = client.post("/get_image_description", data=json.dumps(payload), content_type="application/json")
    assert response.status_code == 400
    assert "error" in response.get_json()

def test_get_image_description_empty_payload(client):
    response = client.post("/get_image_description", data="", content_type="application/json")
    assert response.status_code == 500 or response.status_code == 400

def test_get_image_description_invalid_json(client):
    response = client.post("/get_image_description", data="not-a-json", content_type="application/json")
    assert response.status_code == 400 or response.status_code == 500

def test_get_image_description_empty_prompt_and_images(client):
    payload = {
        "prompt": "",
        "images": [DUMMY_IMAGE_BASE64]
    }

    response = client.post("/get_image_description", data=json.dumps(payload), content_type="application/json")
    assert response.status_code in [200, 500]

def test_get_image_description_invalid_base64(client):
    payload = {
        "prompt": "Is this corrupted?",
        "images": ["this-is-not-valid-base64"]
    }

    response = client.post("/get_image_description", data=json.dumps(payload), content_type="application/json")
    assert response.status_code == 500
    assert "error" in response.get_json()


def test_get_image_description_multiple_images(client):
    payload = {
        "prompt": "Describe all the images.",
        "images": [
            # Two identical dummy images for simplicity
            DUMMY_IMAGE_BASE64,
            DUMMY_IMAGE_BASE64
        ]
    }

    response = client.post(
        "/get_image_description",
        data=json.dumps(payload),
        content_type="application/json"
    )

    assert response.status_code in [200, 500]  # Allow for API error if OpenAI fails

    json_data = response.get_json()
    if response.status_code == 200:
        assert "response" in json_data
        assert isinstance(json_data["response"], str)
        assert len(json_data["response"]) > 0
    else:
        assert "error" in json_data
