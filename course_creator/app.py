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
            j = {
    "course": "algebra 2",
    "modules": [
        [
            {
                "learning_objectives": [
                    "Compute with and categorize real numbers.",
                    "Apply order of operations correctly.",
                    "Understand and use exponents and scientific notation."
                ],
                "unit_name": "Module 1: Basic Concepts",
                "unit_summary": "Introduction to fundamental algebraic concepts, including real numbers, order of operations, and exponents.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            },
            {
                "learning_objectives": [
                    "Solve and apply linear equations and inequalities.",
                    "Utilize formulas in problem-solving contexts."
                ],
                "unit_name": "Module 2: Solving Linear Equations",
                "unit_summary": "Techniques for solving linear equations and inequalities, and applying these methods to real-world problems.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            },
            {
                "learning_objectives": [
                    "Analyze and use graphs and functions.",
                    "Graph linear inequalities."
                ],
                "unit_name": "Module 3: Graphs and Functions",
                "unit_summary": "Understanding and analyzing graphs and functions, including slope-intercept form and graphing linear inequalities.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            },
            {
                "learning_objectives": [
                    "Solve systems of equations and inequalities with two and three variables."
                ],
                "unit_name": "Module 4: Systems of Linear Equations",
                "unit_summary": "Solving systems of linear equations and inequalities using various methods.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            },
            {
                "learning_objectives": [
                    "Compute with and factor polynomials and polynomial functions.",
                    "Solve polynomial equations."
                ],
                "unit_name": "Module 5: Polynomials and Factoring",
                "unit_summary": "Operations with polynomials, factoring techniques, and solving polynomial equations.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            },
            {
                "learning_objectives": [
                    "Compute with rational expressions and solve rational equations.",
                    "Understand and apply concepts of variation."
                ],
                "unit_name": "Module 6: Rational Expressions and Equations",
                "unit_summary": "Working with rational expressions, solving rational equations, and understanding variation.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            },
            {
                "learning_objectives": [
                    "Compute with and simplify radicals, roots, and complex numbers.",
                    "Solve radical equations."
                ],
                "unit_name": "Module 7: Roots, Radicals, and Complex Numbers",
                "unit_summary": "Simplifying radicals, working with rational exponents, and understanding complex numbers.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            },
            {
                "learning_objectives": [
                    "Solve quadratic functions by completing the square and using the quadratic formula.",
                    "Graph quadratic functions."
                ],
                "unit_name": "Module 8: Quadratic Functions",
                "unit_summary": "Solving and graphing quadratic functions using various methods.",
                "unit_url": "https://courses.edx.org/courses/course-v1:DoaneX+MATH-105x+2T2022/32f93eb6788f4b4098b94742833706f8/"
            }
        ]
    ]
}
            return jsonify(j), 200
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