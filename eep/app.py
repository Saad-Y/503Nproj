from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import openai
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from document_upload import document_upload_route

VAULT_URL = "https://vault503n.vault.azure.net/"
credential = DefaultAzureCredential()
client = SecretClient(vault_url=VAULT_URL, credential=credential)
openai.api_key = client.get_secret('OPENAI-API-KEY').value

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.register_blueprint(document_upload_route)



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3000)
    