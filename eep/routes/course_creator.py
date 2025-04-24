from flask import Blueprint, request, jsonify
import requests
import os

IEP_COURSE_CREATOR_URL = os.getenv("IEP_COURSE_CREATOR_URL", "http://gpt:5004")

iep_course_creator_routes = Blueprint("iep_course_creator_routes", __name__)

@iep_course_creator_routes.route("/iep/generate_course", methods=["POST"])
def generate_course():
    """
    Proxy endpoint to the IEP Course Creator service.
    Expects JSON payload with:
        - student_status: str
        - course: str
        - platforms: list of str
    """
    data = request.get_json()
    try:
        resp = requests.post(
            f"{IEP_COURSE_CREATOR_URL}/generate_course",
            json=data,
            timeout=120  # adjust as needed
        )
        resp.raise_for_status()
        # If the backend streams results, you may need to handle streaming here.
        return jsonify(resp.json()), resp.status_code
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to generate course: {str(e)}"}), 502