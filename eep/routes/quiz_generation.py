from flask import Blueprint, request, jsonify, abort
from langchain.text_splitter import RecursiveCharacterTextSplitter
from difflib import SequenceMatcher
from chromadb import Client
import openai
from routes.auth_routes import token_required
from database.vectordb import client
import logging
import requests

GPT_IEP = 'localhost'
EMBEDDINGS_IEP = 'localhost'

quiz_routes = Blueprint("quiz_routes", __name__)

# === You should have your OpenAI key set somewhere in your config ===
openai.api_key = "your-api-key"  # Use env var or config manager instead

system_message = (
      'You are an expert teacher. From the following text, generate multiple-choice questions covering all key ideas. '
      'Each question should have:'
      '- a "question" field (string),'
      '- an "options" field (list of 4 strings), and'
      '- an "answer" field (integer, the index [0–3] of the correct option).'
      'Respond **only** with a JSON array like this:'
      '['
      '  {'
      '    "question": "What is X?",'
      '    "options": ["A", "B", "C", "D"],'
      '    "answer": 2'
      '  },'
      '  ...'
      ']'
  )

@quiz_routes.route("/generate_quiz", methods=["POST"])
@token_required
def generate_quiz(username):
    """
    Generates a multiple-choice quiz based on the content of either a specified document or a specific topic.

    This endpoint retrieves all text chunks associated with the given document ID
    (stored under the user's ChromaDB collection), reconstructs the full document,
    splits it into larger logical sections, and generates quiz questions for each
    section using a GPT-based model via an internal service call.

    Authentication is required via the `@token_required` decorator, and the username
    is inferred from the token.

    Expects:
        JSON payload with:
        - "document_id" (str): The ID of the document to generate a quiz for.
        - "topic" (str): the topic to generate a quiz about
        - EITHER document_id OR topic must be specified


    Returns:
        - 200 OK: 
            JSON object containing:
                - "document_id" (str)
                - "username" (str)
                - "quiz" (str): Generated quiz composed of MCQs from all document sections.
        - 400 Bad Request: If the document ID or username is missing.
        - 502 Bad Gateway: If ChromaDB fails to fetch the document chunks or if an internal GPT call fails.

    """
    global system_message
    data = request.get_json()
    document_id = data.get("document_id", '')
    topic = data.get('topic', '')

    if not username or (not document_id and not topic):
        return jsonify({"error": "Missing username or document_id"}), 400
    if document_id and topic:
        return jsonify({"error": "only specify one of 'document_id' and 'topic'"}), 400

    collection = client.get_or_create_collection(name=username)

    try:
        if document_id:
            results = collection.get(where={"original_doc": document_id})
            chunks = results["documents"]
        else:
            embeddings_response = requests.post(
                f"http://{EMBEDDINGS_IEP}:5001/generate_embeddings",
                json={"text": topic}
            )
            embeddings_response.raise_for_status()
            embeddings =  embeddings_response.json()["embedding"]

            results = collection.query(query_embeddings=[embeddings], n_results=15,  where={"id": {"$ne": "none"}})
            system_message += f"The quiz should only be about concepts related to the following topic: {topic}. \n Ignore any context that is not related to this topic."
            chunks = results["documents"][0]
            
        
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
                f"http://{GPT_IEP}:5002/get_response",
                json={
                    "system_message": system_message,
                    "context": section
                }
            )
            response.raise_for_status()
            quiz_text = response.json().get('response', '')
            quiz_sections.append(quiz_text)
        except Exception as e:
            logging.error("error in chunking: " + str(e))
            abort(503)

    full_quiz = "\n\n".join(quiz_sections)

    return jsonify({
        "document_id": document_id,
        "username": username,
        "quiz": full_quiz
    }), 200

# Generate insights for wrong answers
@quiz_routes.route("/generate_insights", methods=["POST"])
def generate_insights():
    """
    Generates insights for wrong answers by querying GPT.

    Expects:
        JSON payload with:
        - "wrong_answers" (list): List of wrong answers with question and correct answer.

    Returns:
        - 200 OK:
            JSON object containing:
                - "insights" (list): List of insights for each wrong answer.
        - 400 Bad Request: If the payload is missing or invalid.
        - 502 Bad Gateway: If GPT service fails.
    """
    data = request.get_json()
    wrong_answers = data.get("wrong_answers", [])

    if not wrong_answers:
        return jsonify({"error": "Missing or invalid wrong_answers payload"}), 400

    insights = []
    for answer in wrong_answers:
        try:
            response = requests.post(
                f"http://{GPT_IEP}:5002/get_response",
                json={
                    "system_message": "You are an expert teacher. Provide a very brief explanation for the following correct answer:",
                    "context": answer["correct_answer"]
                }
            )
            response.raise_for_status()
            insight = response.json().get('response', '')
            insights.append({"question": answer["question"], "insight": insight})
        except Exception as e:
            logging.error("Error generating insight: " + str(e))
            return jsonify({"error": "Failed to generate insights"}), 502

    return jsonify({"insights": insights}), 200
