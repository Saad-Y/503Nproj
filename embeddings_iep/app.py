from flask import Flask, request, jsonify 
from flask_cors import CORS
import openai
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

VAULT_URL = "https://vault503n.vault.azure.net/"
credential = DefaultAzureCredential()
client = SecretClient(vault_url=VAULT_URL, credential=credential)
openai.api_key = client.get_secret('OPENAI-API-KEY').value

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

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
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Missing or invalid JSON with 'text' key"}), 400

    text = data["text"]

    try:
        response = openai.embeddings.create(input=text, model="text-embedding-3-large")
        embedding = response.data[0].embedding
    except Exception as e:
        return jsonify({"error": str(e)}), 503

    return jsonify({"embedding": embedding}), 200


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001)