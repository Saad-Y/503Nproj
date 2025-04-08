from flask import Blueprint, request, jsonify
from langchain.text_splitter import RecursiveCharacterTextSplitter
from difflib import SequenceMatcher
from chromadb import Client
import openai
from routes.auth_routes import token_required
from database.vectordb import client
import logging
import requests

GPT_IEP = 'localhost'

quiz_routes = Blueprint("quiz_routes", __name__)

# === You should have your OpenAI key set somewhere in your config ===
openai.api_key = "your-api-key"  # Use env var or config manager instead

system_message = (
      "You are an expert teacher. From the following text, generate multiple-choice questions covering all key ideas. "
      "Each question should have:\n"
      "- a 'question' field (string),\n"
      "- an 'options' field (list of 4 strings), and\n"
      "- an 'answer' field (integer, the index [0–3] of the correct option).\n\n"
      "Respond **only** with a JSON array like this:\n"
      "[\n"
      "  {\n"
      "    \"question\": \"What is X?\",\n"
      "    \"options\": [\"A\", \"B\", \"C\", \"D\"],\n"
      "    \"answer\": 2\n"
      "  },\n"
      "  ...\n"
      "]"
  )

@quiz_routes.route("/generate_quiz", methods=["POST"])
@token_required
def generate_quiz(username):
    """
    Generates a multiple-choice quiz based on the content of a specified document.

    This endpoint retrieves all text chunks associated with the given document ID
    (stored under the user's ChromaDB collection), reconstructs the full document,
    splits it into larger logical sections, and generates quiz questions for each
    section using a GPT-based model via an internal service call.

    Authentication is required via the `@token_required` decorator, and the username
    is inferred from the token.

    Expects:
        JSON payload with:
        - "document_id" (str): The ID of the document to generate a quiz for.

    Returns:
        - 200 OK: 
            JSON object containing:
                - "document_id" (str)
                - "username" (str)
                - "quiz" (str): Generated quiz composed of MCQs from all document sections.
        - 400 Bad Request: If the document ID or username is missing.
        - 502 Bad Gateway: If ChromaDB fails to fetch the document chunks or if an internal GPT call fails.

    """
    data = request.get_json()
    document_id = data.get("document_id")

    if not username or not document_id:
        return jsonify({"error": "Missing username or document_id"}), 400

    collection = client.get_collection(name=username)

    try:
        results = collection.get(where={"original_doc": document_id})
        chunks = results["documents"]
    except Exception as e:
        return jsonify({"error": f"Failed to fetch chunks: {str(e)}"}), 502
    print(chunks)

    full_text = "\n\n".join(chunks)

    # Re-split into ~3000-character subchunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000,
        chunk_overlap=0,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    sub_chunks = text_splitter.split_text(full_text)

    # Generate quiz for each subchunk
    quiz_sections = []
    for i, section in enumerate(sub_chunks):
        try:
            response = requests.post(
                f"http://{GPT_IEP}:3002/get_response",
                json={
                    "system_message": system_message,
                    "context": section
                }
            )
            response.raise_for_status()
            quiz_text = response.json().get('response', '')
            quiz_sections.append(quiz_text)
        except Exception as e:
            quiz_sections.append(f"[Error in chunk {i}: {str(e)}]")

    full_quiz = "\n\n".join(quiz_sections)

    return jsonify({
        "document_id": document_id,
        "username": username,
        "quiz": full_quiz
    }), 200
