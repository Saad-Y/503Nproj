from flask import Flask, request, jsonify 
from flask_cors import CORS
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from prometheus_client import start_http_server, Counter, generate_latest, Histogram
import threading
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from backend import  generate_course

load_dotenv()

# -------------------- Prometheus Metrics --------------------

# Endpoint 1: /generate_course
COURSE_CALLS = Counter('gpt_iep_generate_course_calls_total', 'Total calls to /generate_course')
COURSE_LATENCY = Histogram(
    'gpt_iep_generate_course_latency_seconds',
    'Latency for /generate_course',
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)
COURSE_ERRORS = Counter(
    'gpt_iep_generate_course_errors_total',
    'Errors in /generate_course',
    ['error_type']
)


api_key = os.getenv('OPENAI_API_KEY')


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.route("/generate_course", methods=['POST'])   
def generate_course_api():
    """
    Generates a course based on the provided parameters.
    Expects:
        - student_status: str
        - course: str
        - platforms: list of str
    Returns:
        - JSON response with the generated course details.
    """
    with COURSE_LATENCY.time():
        COURSE_CALLS.inc()
        data = request.get_json()
        student_status = data.get('student_status')
        course = data.get('course')
        platforms = data.get('platforms')

        if not student_status or not course or not platforms:
            COURSE_ERRORS.labels(error_type="bad_request").inc()
            return jsonify({"error": "Missing required parameters"}), 400
        try:
            course_content = generate_course(api_key, student_status, course, platforms)
            return jsonify({
                "course": course,
                "modules": course_content,  
            }), 200
        except Exception as e:
            COURSE_ERRORS.labels(error_type=type(e).__name__).inc()
            return jsonify({"error": str(e)}), 500

 
@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {'Content-Type': 'text/plain; version=0.0.4'}
   
def start_servers():
    start_http_server(8000)


if __name__ == '__main__':
    server_thread = threading.Thread(target=start_servers).start()
    app.run(host="0.0.0.0", port=5004)