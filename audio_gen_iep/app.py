from flask import Flask, send_file, jsonify, request
import os
from dotenv import load_dotenv
from pathlib import Path
from openai import OpenAI
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from prometheus_client import start_http_server, Counter, generate_latest, Histogram
import threading


SYNTH_CALLS = Counter(
    'gpt_iep_synthesize_calls_total',
    'Total number of calls to /synthesize'
)

SYNTH_LATENCY = Histogram(
    'gpt_iep_synthesize_latency_seconds',
    'Latency of /synthesize endpoint in seconds',
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

SYNTH_ERRORS = Counter(
    'gpt_iep_synthesize_errors_total',
    'Number of errors encountered in /synthesize',
    ['error_type']
)

load_dotenv()
app = Flask(__name__)


OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

client = OpenAI(api_key=OPENAI_API_KEY)

@app.route('/synthesize', methods=['GET'])
def synthesize():
    SYNTH_CALLS.inc()
    with SYNTH_LATENCY.time():
        data = request.get_json()

        if not data or "text" not in data:
            SYNTH_ERRORS.labels(error_type="bad_request").inc()
            return jsonify({"error": "Missing or invalid JSON with 'text' key"}), 400

        text = data["text"]
        try:
            speech_file_path = Path(__file__).parent / "speech.mp3"

            instructions = (
                "Voice: Clear, authoritative, and composed, projecting confidence and professionalism.\n"
                "Tone: Engaging and informative, maintaining a balance between formality and approachability.\n"
                "Punctuation: Structured with commas and pauses for clarity, ensuring information is digestible and well-paced.\n"
                "Delivery: Steady and measured, with slight emphasis on main ideas to highlight critical points.\n"
                "You will be addressing students, so you must be both fun and academic."
            )

            with client.audio.speech.with_streaming_response.create(
                model="gpt-4o-mini-tts",
                voice="onyx",
                input=text,
                instructions=instructions,
                speed=1.25
            ) as response:
                response.stream_to_file(speech_file_path)

            return send_file(
                speech_file_path,
                as_attachment=True,
                download_name="speech.mp3",
                mimetype="audio/mpeg"
            )

        except Exception as e:
                SYNTH_ERRORS.labels(error_type=type(e).__name__).inc()
                return jsonify({"error": str(e)}), 500


@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {'Content-Type': 'text/plain; version=0.0.4'}
   
def start_servers():
    start_http_server(8000)


if __name__ == '__main__':
    server_thread = threading.Thread(target=start_servers)
    app.run(host="0.0.0.0", port=5003,debug=True)
