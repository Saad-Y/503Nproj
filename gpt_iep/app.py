from flask import Flask, request, jsonify 
from flask_cors import CORS
import openai
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import base64
import requests

VAULT_URL = "https://vault503n.vault.azure.net/"
credential = DefaultAzureCredential()
client = SecretClient(vault_url=VAULT_URL, credential=credential)
openai.api_key = client.get_secret('OPENAI-API-KEY').value

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

from flask import Flask, request, jsonify
import base64
import requests
import openai  # assumes openai.api_key is already set somewhere

app = Flask(__name__)

@app.route("/get_image_description", methods=['POST'])
def get_image_description():
    """
    Analyzes one or more images using the GPT-4o vision model and returns a text-based description.

    Expects:
        A JSON payload with:
        - "prompt" (str, optional): An instruction or question for GPT-4o to contextualize the image analysis.
        - "images" (list of str): A list of base64-encoded JPEG images (without the data URL prefix).

    Behavior:
        - Builds a multi-modal request with the prompt and images.
        - Sends the request to the OpenAI GPT-4o API.
        - Extracts the model's textual response and returns it.

    Returns:
        - 200: {"response": "<GPT-4o generated description>"}
        - 400: {"error": "No images provided"} if no image list is passed
        - 500: {"error": "<exception message>"} if an error occurs during the API call

    Notes:
        - Images must be valid base64-encoded JPEGs.
        - The OpenAI API key must be correctly configured via `openai.api_key`.
    """
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        images = data.get('images', [])

        if not images:
            return jsonify({"error": "No images provided"}), 400

        # Build the message content with prompt and images
        message_content = [{"type": "text", "text": prompt}]
        for img_b64 in images:
            message_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{img_b64}"
                }
            })

        # OpenAI API call
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai.api_key}"
        }

        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "user", "content": message_content}
            ],
            "max_tokens": 500
        }

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        reply = response.json()['choices'][0]['message']['content']
        return jsonify({"response": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_response", methods=['POST'])
def get_response():
    """
   returns a response to a prompt.

    Expects:
        A JSON payload with:
        - "system_message" (str).
        - "context" (str).

    Returns:
        - 200: {"response": "<GPT-4o generated response>"}
        - 400: if no prompt is passed
        - 500: {"error": "<exception message>"} if an error occurs during the API call

    """
    try:
        data = request.get_json()
        system_message = data.get('system_message', '')
        context = data.get('context', '')

        if not context or not system_message:
            return jsonify({"error": "No prompt provided"}), 400


        # OpenAI API call
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai.api_key}"
        }

        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": context}
            ],
        }

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        reply = response.json()['choices'][0]['message']['content']
        return jsonify({"response": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3002)