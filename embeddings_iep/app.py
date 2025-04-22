from flask import Flask, request, jsonify 
from flask_cors import CORS
import openai
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from prometheus_client import start_http_server, Counter, generate_latest, Histogram
import threading
import os
from dotenv import load_dotenv
load_dotenv()

EMBED_CALLS = Counter(
    'gpt_iep_generate_embeddings_calls_total',
    'Total number of calls to /generate_embeddings'
)

EMBED_LATENCY = Histogram(
    'gpt_iep_generate_embeddings_latency_seconds',
    'Latency of /generate_embeddings in seconds',
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

EMBED_ERRORS = Counter(
    'gpt_iep_generate_embeddings_errors_total',
    'Number of errors encountered in /generate_embeddings',
    ['error_type']
)


openai.api_key = os.getenv('OPENAI_API_KEY')


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.route("/generate_embeddings", methods=["POST"])
def generate_embeddings():
    """
    Generate an embedding for a given text using OpenAI.

    Expects:
        JSON body with a "text" field (string).

    Returns:
        200: {"embedding": [...]}
        400: {"error": "Missing or invalid JSON with 'text' key"}
        500: {"error": "<error message from OpenAI>"}
    """
    EMBED_CALLS.inc()
    with EMBED_LATENCY.time():
        data = request.get_json()

        if not data or "text" not in data:
            EMBED_ERRORS.labels(error_type="bad_request").inc()
            return jsonify({"error": "Missing or invalid JSON with 'text' key"}), 400

        text = data["text"]

        try:
            response = openai.embeddings.create(input=text, model="text-embedding-3-large")
            embedding = response.data[0].embedding
        except Exception as e:
            EMBED_ERRORS.labels(error_type=type(e).__name__).inc()
            return jsonify({"error": str(e)}), 503

        return jsonify({"embedding": embedding}), 200

   

@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {'Content-Type': 'text/plain; version=0.0.4'}
   
def start_servers():
    start_http_server(8000)


if __name__ == '__main__':
    server_thread = threading.Thread(target=start_servers).start()
    app.run(host="0.0.0.0", port=5001)