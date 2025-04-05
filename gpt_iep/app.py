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



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3002)