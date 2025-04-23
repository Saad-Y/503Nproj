from flask import Flask, request, jsonify 
from flask_cors import CORS
import openai
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from prometheus_client import start_http_server, Counter, generate_latest, Histogram
import threading
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
import base64
import requests
import openai  # assumes openai.api_key is already set somewhere


load_dotenv()

# -------------------- Prometheus Metrics --------------------

# Endpoint 1: /get_image_description
IMG_CALLS = Counter('gpt_iep_image_calls_total', 'Total calls to /get_image_description')
IMG_LATENCY = Histogram(
    'gpt_iep_image_latency_seconds',
    'Latency for /get_image_description',
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)
IMG_ERRORS = Counter(
    'gpt_iep_image_errors_total',
    'Errors in /get_image_description',
    ['error_type']
)

# Endpoint 2: /get_response
RESP_CALLS = Counter('gpt_iep_response_calls_total', 'Total calls to /get_response')
RESP_LATENCY = Histogram(
    'gpt_iep_response_latency_seconds',
    'Latency for /get_response',
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)
RESP_ERRORS = Counter(
    'gpt_iep_response_errors_total',
    'Errors in /get_response',
    ['error_type']
)

openai.api_key = os.getenv('OPENAI_API_KEY')


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)



@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {'Content-Type': 'text/plain; version=0.0.4'}
   
def start_servers():
    start_http_server(8000)


if __name__ == '__main__':
    server_thread = threading.Thread(target=start_servers).start()
    app.run(host="0.0.0.0", port=5002)