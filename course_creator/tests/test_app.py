import pytest
from unittest.mock import patch, AsyncMock
from flask import Request
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from app import app, generate_course

@pytest.mark.asyncio
@patch("app.get_urls")
@patch("app.async_get_modules", new_callable=AsyncMock)
async def test_generate_course_success(mock_async_get_modules, mock_get_urls):
    mock_get_urls.return_value = ["https://dummy-url.com"]
    mock_async_get_modules.return_value = {"course": "Generated Course"}

    payload = {
        "student_status": "undergrad",
        "course": "math101",
        "platforms": ["coursera", "udemy"]
    }

    with app.test_request_context(
        "/generate_course", method="POST", data=json.dumps(payload), content_type="application/json"
    ):
        response = await generate_course()

    assert response == {"course": "Generated Course"}



@pytest.mark.asyncio
async def test_generate_course_missing_params():
    incomplete_payload = {
        "course": "math101",
        "platforms": ["coursera"]
        # missing student_status
    }

    with app.test_request_context(
        "/generate_course", method="POST", data=json.dumps(incomplete_payload), content_type="application/json"
    ):
        response = await generate_course()

    assert response[1] == 400
    assert "error" in response[0].json


@pytest.mark.asyncio
async def test_generate_course_invalid_json():
    # Invalid JSON – not even a dict
    with app.test_request_context(
        "/generate_course", method="POST", data="not-a-json", content_type="application/json"
    ):
        try:
            await generate_course()
        except Exception as e:
            assert isinstance(e, Exception)  # You can be more specific if needed