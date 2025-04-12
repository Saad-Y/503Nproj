from flask import Flask, send_file, jsonify, request
import os
from dotenv import load_dotenv
from pathlib import Path
from openai import OpenAI
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient


load_dotenv()
app = Flask(__name__)


VAULT_URL = "https://vault503n.vault.azure.net/"
credential = DefaultAzureCredential()
client = SecretClient(vault_url=VAULT_URL, credential=credential)
OPENAI_API_KEY = client.get_secret('OPENAI-API-KEY').value

client = OpenAI(api_key=OPENAI_API_KEY)

@app.route('/synthesize', methods=['GET'])
def synthesize():
    speech_file_path = Path(__file__).parent / "speech.mp3"

    text = ("Mathematics is the universal language that unlocks the mysteries of the world around us. "
            "In this overview, we will explore the beauty of mathematical reasoning—from the precision of algebra "
            "and the elegance of geometry to the dynamic insights of calculus.")
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

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3003)
