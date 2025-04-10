import logging
import os
from flask import request, abort, Blueprint, jsonify
import magic
from werkzeug.utils import secure_filename
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import base64
import requests
from pdf2image import convert_from_path
from PIL import Image
from io import BytesIO
from datetime import datetime
import os
import PyPDF2
from docx import Document
from eep.database.database import db
from eep.model.doc import Doc
from eep.routes.auth_routes import token_required
from eep.database.vectordb import client

GPT_IEP = 'localhost'
EMBEDDINGS_IEP = 'localhost'

document_upload_route = Blueprint('document_upload_routes', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf' , 'docx', 'txt'}
UPLOAD_FOLDER = ''

def allowed_file_type(file_path):
    # Use magic to determine the file type
    mime = magic.Magic(mime=True)
    file_mime_type = mime.from_file(file_path)
    logging.info(f"Detected MIME type: {file_mime_type}")
    logging.info(file_mime_type in ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'])
    return file_mime_type in ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']

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
            # First try to extract text directly from PDF
            pdf_text = ""
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    pdf_text += page.extract_text() + "\n"
            
            # If we successfully extracted meaningful text, return it
            if pdf_text.strip():
                return pdf_text.strip()
                
            # If no text or extraction failed, fall back to image conversion
            images = convert_from_path(file_path, dpi=300)
            for img in images:
                buffer = BytesIO()
                img.save(buffer, format="JPEG")
                images_base64.append(base64.b64encode(buffer.getvalue()).decode("utf-8"))
        except Exception as e:
            logging.error(f"Failed to process PDF file: {e}")
            return []
    elif file_path.lower().endswith(".docx"):
        try:
            document = Document(file_path)
            text = "\n".join([para.text for para in document.paragraphs])
            extracted_text = text.strip()
            if not extracted_text:
                raise ValueError("The uploaded DOCX is empty or contains no extractable text.")
            return extracted_text
        except Exception as e:
            logging.error(f"Failed to process DOCX file: {e}")
            return []
        
    elif file_path.lower().endswith(".txt"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read().strip()
            if not text:
                raise ValueError("The uploaded TXT file is empty.")
            return text
        except UnicodeDecodeError:
            logging.error("The TXT file contains non-UTF-8 characters.")
            return []
        except Exception as e:
            logging.error(f"Failed to process TXT file: {e}")
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

@document_upload_route.route("/upload_document", methods=["POST"])
@token_required
def upload_document(username):
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

        # Check the file type using magic
        if not allowed_file_type(file_path):
            os.remove(file_path)
            logging.warning(f'Filetype of {filename} not allowed')
            abort(400)

    else:
        abort(400)

    images_base64 = encode_document(file_path)
    if not images_base64:
        abort(503)

    # Prepare request to GPT-4o image analysis endpoint
    processed_chunks = []

    prompt = "Extract all key ideas from these images and create concise study notes from them."

    for batch in batch_images(images_base64, batch_size=5):
        try:
            response = requests.post(
                f"http://{GPT_IEP}:3002/get_image_description",
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

    os.remove(file_path)

    processed_text = "\n\n".join(processed_chunks)
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,         
        chunk_overlap=200,       
        separators=["\n\n", "\n", ". ", " ", ""],  
    )

    document = Document(page_content=processed_text)
    data = text_splitter.split_documents([document])
    collection = client.get_or_create_collection(name=username)
    try:
        doc = Doc(owner_username=username, title=file_path)
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
                f"http://{EMBEDDINGS_IEP}:3001/generate_embeddings",
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