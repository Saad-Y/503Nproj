from sentence_transformers import SentenceTransformer , util
from flask import jsonify, request , Flask 
from flask_cors import CORS
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
# Load the SBERT model (e.g., 'all-MiniLM-L6-v2' is lightweight and CPU-friendly)
model = SentenceTransformer('model/all-MiniLM-L6-v2')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

VAULT_URL = "https://vault503n.vault.azure.net/"
credential = DefaultAzureCredential()
client = SecretClient(vault_url=VAULT_URL, credential=credential)

@app.route("/generate_embeddings", methods=["POST"])
def generate_embeddings():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing or invalid JSON with 'text' key"}), 400

    text = data["text"]

    try:
        # Generate embeddings locally
        embedding = model.encode(text).tolist()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"embedding": embedding}), 200

@app.route("/similarity", methods=["POST"])
def sim():
    data = request.get_json()
    if not data or "text1" not in data or "text2" not in data:
        return jsonify({"error": "Missing or invalid JSON with 'text1' and 'text2' keys"}), 400

    text1 = data["text1"]
    text2 = data["text2"]

    try:
        # Generate embeddings locally
        embedding1 = model.encode(text1)
        embedding2 = model.encode(text2)

        # Compute cosine similarity
        similarity = util.cos_sim(embedding1, embedding2).item()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"similarity": similarity}), 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3001)