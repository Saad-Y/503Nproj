import logging
import os
from flask import request, abort, Blueprint, jsonify
import magic
from werkzeug.utils import secure_filename
from langchain.text_splitter import RecursiveCharacterTextSplitter
import langchain.schema
import base64
import requests
from pdf2image import convert_from_path
from PIL import Image
from io import BytesIO
from datetime import datetime
import os
import PyPDF2
from docx import Document
from database.database import db
from model.doc import Doc
from routes.auth_routes import token_required
from database.vectordb import client
from tools.file_processor_service import FileProcessorService
from chromadb.utils import embedding_functions
from numpy import dot
from numpy.linalg import norm

def cosine_similarity(a, b):
    return dot(a, b) / (norm(a) * norm(b))
GPT_IEP = os.getenv("GPT_IEP", "http://gpt:5002")
EMBEDDINGS_IEP = os.getenv("EMBEDDINGS_IEP", "http://embeddings:5001")
print(EMBEDDINGS_IEP)

document_upload_route = Blueprint('document_upload_routes', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf' , 'docx', 'txt'}
UPLOAD_FOLDER = ''

def allowed_file_type(file_path):
    # Use magic to determine the file type
    mime = magic.Magic(mime=True)
    file_mime_type = mime.from_file(file_path)
    logging.info(f"Detected MIME type: {file_mime_type}")
    return file_mime_type in ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_document(file_path):
    """
    Converts a document (PDF or image) into a list of base64-encoded JPEG images.

    For PDF files:
        - Converts each page of the PDF into a JPEG image.
        - Encodes each image in base64.

    For image files:
        - Converts the image to JPEG format if necessary (e.g., RGBA ➜ RGB).
        - Encodes the image in base64.

    Args:
        file_path (str): The path to the document file (PDF or image).

    Returns:
        List[str]: A list of base64-encoded JPEG images as strings.
                   Returns an empty list if the file cannot be processed.
    """
    images_base64 = []
    
    if file_path.lower().endswith(".pdf"):
        try:               
            # If no text or extraction failed, fall back to image conversion
            images = convert_from_path(file_path, dpi=300)
            for img in images:
                buffer = BytesIO()
                img.save(buffer, format="JPEG")
                images_base64.append(base64.b64encode(buffer.getvalue()).decode("utf-8"))
        except Exception as e:
            logging.error(f"Failed to process PDF file: {e}")
            return []
        
    else:
        try:
            img = Image.open(file_path)
            if img.mode == "RGBA":
                img = img.convert("RGB")
            buffer = BytesIO()
            img.save(buffer, format="JPEG")
            images_base64.append(base64.b64encode(buffer.getvalue()).decode("utf-8"))
        except Exception as e:
            logging.error(f"Failed to process image file: {e}")
            return []

    return images_base64
    
def batch_images(images, batch_size=5):
    for i in range(0, len(images), batch_size):
        yield images[i:i + batch_size]

@document_upload_route.route('/documents', methods=['GET'])
@token_required
def get_all_documents(username):
    docs = Doc.query.filter_by(owner_username = username).all()
    results = []
    for doc in docs:
        results.append({
            'id': doc.id,
            'owner_username': doc.owner_username,
            'title': doc.title
        })

    return jsonify(results)

def process_nonparsable_document(file_path):
    images_base64 = encode_document(file_path)
    if not images_base64:
        abort(503)

    # Prepare request to GPT-4o image analysis endpoint
    processed_chunks = []
    prompt = "Extract all key ideas from these images and create concise study notes from them."

    for batch in batch_images(images_base64, batch_size=5):
        try:
            response = requests.post(
                f"{GPT_IEP}/get_image_description",
                json={
                    "prompt": prompt,
                    "images": batch
                }
            )
            response.raise_for_status()
            chunk = response.json().get('response', '')
            if chunk:
                processed_chunks.append(chunk)
        except Exception as e:
            logging.error(f"Failed batch image description: {e}")
            continue  # Skip bad batch

    return processed_chunks

def process_parsable_document(file):
    try:
        file_processor = FileProcessorService
        text = file_processor.process_file(file)
        return text
    except ValueError as e:
        abort(400)

@document_upload_route.route("/upload_document_parsable", methods=["POST"])
@token_required
def upload_document_parsable(username):
    return upload_document(username, request, True)

@document_upload_route.route("/upload_document_non_parsable", methods=["POST"])
@token_required
def upload_document_non_parsable(username):
    return upload_document(username, request, False)


def upload_document(username, request, parsable):
    """
    Handles the upload, processing, and embedding of a document (PDF or image).

    Workflow:
        1. Validates the uploaded file.
        2. Saves the file securely to disk.
        3. Checks the file type using libmagic.
        4. Converts the document to base64-encoded JPEG images:
            - PDFs are converted page-by-page.
            - Image files are converted directly.
        5. Sends the images in batches to a GPT-based endpoint for summarization.
        6. Concatenates the GPT-generated summaries into a single text.
        7. Splits the resulting text into chunks using RecursiveCharacterTextSplitter.
        8. For each chunk:
            - Sends it to an embedding endpoint to generate vector representations.
            - Stores the embeddings in a ChromaDB collection named "general".

    Returns:
        Response: HTTP 200 on success, appropriate HTTP error codes on failure.

    Errors:
        - 400: If no file is provided, or file type is not allowed.
        - 503: If saving or processing the file fails.
        - 502: If communication with GPT or embedding endpoints fails.

    """
    if 'file' not in request.files:
        logging.warning("No file to upload")
        abort(400)

    file = request.files.get('file')
    if file.filename == '':
        logging.warning('No selected file')
        abort(400)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        try:
            file.save(file_path)
        except Exception as e:
            logging.error(f'Error saving file: {filename}: {e}')
            abort(503)


    else:
        abort(400)

    if parsable == False:
        processed_chunks = process_nonparsable_document(file_path)
        processed_text = "\n\n".join(processed_chunks)
    else:
        processed_text = process_parsable_document(file)
        
    os.remove(file_path)
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,         
        chunk_overlap=200,       
        separators=["\n\n", "\n", ". ", " ", ""],  
    )

    document = langchain.schema.Document(page_content=processed_text)
    data = text_splitter.split_documents([document])
    collection = client.get_or_create_collection(name=username)
    try:
        doc = Doc(owner_username=username, title=filename)
        db.session.add(doc)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logging.error("error while inserting doc record in SQL DB: "+str(e))
        abort(502)

    for index, item in enumerate(data):
        entry_id = f"{file_path}-{index}"
        try:
            response = requests.post(
                f"{EMBEDDINGS_IEP}/generate_embeddings",
                json={"text": item.page_content}
            )
            response.raise_for_status()
            embeddings =  response.json()["embedding"]
            collection.add(
                ids=[entry_id],
                embeddings = [embeddings],
                documents=[item.page_content],
                metadatas=[{"date_added": datetime.now().isoformat(), "original_doc": doc.id}]
            )

        except Exception as e:
            # Log or handle error
            print(f"Failed to get/store embedding: {e}")
            abort(502)

    return "", 200



@document_upload_route.route("/delete_document/<int:doc_id>", methods=["DELETE"])
@token_required
def delete_document(username, doc_id):
    try:
        # Fetch document from DB
        document = Doc.query.filter_by(id=doc_id, owner_username=username).first()
        if not document:
            return jsonify({"error": "Document not found or unauthorized"}), 404

        # Delete from ChromaDB collection (assumed to be named after username)
        collection = client.get_or_create_collection(name=username)
        all_docs = collection.get(include=["metadatas"])
        doc_ids = all_docs.get("ids", [])

        ids_to_delete = [
            doc_id_in_chroma
            for doc_id_in_chroma, metadata in zip(doc_ids, all_docs['metadatas'])
            if str(metadata.get("original_doc")) == str(doc_id)
        ]

        if ids_to_delete:
            collection.delete(ids=ids_to_delete)


        # Delete from SQL database
        db.session.delete(document)
        db.session.commit()

        return jsonify({"message": "Document deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 404

@document_upload_route.route('/fetch_notes', methods=['GET'])
@token_required
def fetch_notes_by_document(username):
    """
    Fetch notes associated with a specific document from ChromaDB.
    a document is given and then all associated notes are returned.
    """
    try:
        doc_name = request.args.get('doc_name')
        if not doc_name:
            return jsonify({"error": "Document name is required"}), 400
        
        # Check if the document exists in the SQL database
        # and is owned by the user
        doc = Doc.query.filter_by(owner_username=username, title=doc_name).first()
        if not doc:
                return jsonify({"error": "Document not found or access denied"}), 404
        
        # Query ChromaDB for embeddings with the document name as metadata
        collection = client.get_or_create_collection(name=username)
        results = collection.get(where={"original_doc": doc.id})

        if not results["documents"]:
            return jsonify({"error": "No notes found for this document"}), 404

        # Step 4: Extract and sort notes by index
        raw_notes = results["documents"]
        raw_ids = results["ids"]

        # Pair notes with their indices
        notes_with_indices = []
        for note, entry_id in zip(raw_notes, raw_ids):
            # Extract the index from the entry_id (e.g., "example.pdf-0" -> 0)
            index = int(entry_id.split("-")[-1])
            notes_with_indices.append((index, note))

        # Sort notes by index
        notes_with_indices.sort(key=lambda x: x[0])

        # Remove overlaps and structure the notes
        structured_notes = []
        for i, (_, note) in enumerate(notes_with_indices):
            if i == 0:
                # Add the first chunk as is
                structured_notes.append(note)
            else:
                # Remove the 200-character overlap
                previous_note = structured_notes[-1]
                overlap_length = 200
                structured_notes[-1] = previous_note[:-overlap_length]  # Trim overlap from the previous note
                structured_notes.append(note)


        # Step 5: Combine structured notes into a single response
        combined_notes = "\n\n".join(structured_notes)

        return jsonify({"notes": combined_notes}), 200


    except Exception as e:
        logging.error(f"Error fetching notes for document {doc_name}: {e}")
        return jsonify({"error": "Failed to fetch notes"}), 500
    
@document_upload_route.route('/fetch_notes', methods=['POST'])
@token_required
def search_similar_note(username):
    """
    Search for the most similar note to a user-provided query and return the associated document.
    """
    try:
        # Step 1: Get the query from the request
        data = request.get_json()
        query = data.get('query')
        if not query:
            return jsonify({"error": "note is required"}), 400

        # Step 2: Generate embedding for the query
        response = requests.post(
            f"{EMBEDDINGS_IEP}/generate_embeddings",
            json={"text": query}
        )
        response.raise_for_status()
        query_embedding = response.json()["embedding"]

        # Step 3: Search ChromaDB for the most similar note
        collection = client.get_or_create_collection(name=username)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=1,  # Get the top 1 most similar note
            include=["documents", "metadatas", "distances"]
        )

        if not results["documents"]:
            return jsonify({"error": "No similar notes found"}), 404

        # Step 4: Extract the most similar note and its metadata
        most_similar_note = results["documents"][0][0]
        metadata = results["metadatas"][0][0]
        similarity_score = results["distances"][0][0]
        original_doc_id = metadata["original_doc"]

        # Step 5: Retrieve the associated document from the SQL database
        doc = Doc.query.filter_by(id=original_doc_id, owner_username=username).first()
        if not doc:
            return jsonify({"error": "Associated document not found or access denied"}), 404

        # Step 6: Return the most similar note and associated document details
        return jsonify({
            "query": query,
            "most_similar_note": most_similar_note,
            "similarity_score": similarity_score,
            "associated_document": {
                "id": doc.id,
                "title": doc.title,
                "owner_username": doc.owner_username
            }
        }), 200

    except Exception as e:
        logging.error(f"Error searching for similar note: {e}")
        return jsonify({"error": "Failed to search for similar note"}), 500
