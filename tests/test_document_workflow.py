import unittest
import os
import sys
import tempfile
from unittest.mock import patch, MagicMock
from flask import Flask

# Add parent directory to path to import the document_upload module
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'eep'))

from document_upload import document_upload_route, allowed_file, allowed_file_type, encode_document

class TestDocumentWorkflow(unittest.TestCase):
    
    def setUp(self):
        # Create a Flask app and register the blueprint
        self.app = Flask(__name__)
        self.app.register_blueprint(document_upload_route)
        self.client = self.app.test_client()
        
        # Create a temporary file for testing
        self.temp_file = tempfile.NamedTemporaryFile(delete=False)
        self.temp_filename = os.path.basename(self.temp_file.name)
    
    def tearDown(self):
        # Close and remove the temporary file
        self.temp_file.close()
        os.unlink(self.temp_file.name)
    
    def test_allowed_file(self):
        """Test the allowed_file function with various extensions"""
        self.assertTrue(allowed_file('test.pdf'))
        self.assertTrue(allowed_file('test.docx'))
        self.assertTrue(allowed_file('test.txt'))
        self.assertTrue(allowed_file('test.jpg'))
        self.assertTrue(allowed_file('test.png'))
        self.assertFalse(allowed_file('test.exe'))
        self.assertFalse(allowed_file('test.zip'))
        self.assertFalse(allowed_file('testnoextension'))
    
    @patch('document_upload.magic.Magic')
    def test_allowed_file_type(self, mock_magic):
        """Test the allowed_file_type function for various MIME types"""
        # Setup mock magic to return different MIME types
        mock_mime = MagicMock()
        mock_magic.return_value = mock_mime
        
        # Test with allowed MIME types
        for mime_type in ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']:
            mock_mime.from_file.return_value = mime_type
            self.assertTrue(allowed_file_type('test_file'))
        
        # Test with disallowed MIME type
        mock_mime.from_file.return_value = 'application/x-executable'
        self.assertFalse(allowed_file_type('test_file'))
    
    @patch('document_upload.request')
    @patch('document_upload.allowed_file')
    @patch('document_upload.allowed_file_type')
    @patch('document_upload.encode_document')
    @patch('document_upload.requests.post')
    @patch('document_upload.client.get_or_create_collection')
    def test_upload_document_text_file(self, mock_collection, mock_post, mock_encode, 
                                       mock_allowed_type, mock_allowed_file, mock_request):
        """Test the upload_document route with a text file (PDF/DOCX/TXT)"""
        # Setup mocks
        mock_file = MagicMock()
        mock_file.filename = 'test.pdf'
        mock_request.files = {'file': mock_file}
        
        mock_allowed_file.return_value = True
        mock_allowed_type.return_value = True
        
        # Mock encode_document to return text directly (simulating PDF/DOCX/TXT)
        mock_encode.return_value = "This is extracted text content"
        
        # Mock the embedding response
        mock_response = MagicMock()
        mock_response.json.return_value = {"embedding": [0.1, 0.2, 0.3]}
        mock_post.return_value = mock_response
        
        # Mock the collection
        mock_collection_obj = MagicMock()
        mock_collection.return_value = mock_collection_obj
        
        # Create a context for the test
        with self.app.test_request_context('/upload_document', method='POST'):
            # Need to patch os.remove to prevent actual file deletion
            with patch('os.remove'):
                from document_upload import upload_document
                with patch('flask.abort') as mock_abort:
                    # Execute the function
                    upload_document()
                    
                    # Verify that abort wasn't called
                    mock_abort.assert_not_called()
        
        # Verify the collection add was called
        mock_collection_obj.add.assert_called()
    
    @patch('document_upload.batch_images')
    @patch('document_upload.request')
    @patch('document_upload.allowed_file')
    @patch('document_upload.allowed_file_type')
    @patch('document_upload.encode_document')
    @patch('document_upload.requests.post')
    @patch('document_upload.client.get_or_create_collection')
    def test_upload_document_image_file(self, mock_collection, mock_post, mock_encode, 
                                        mock_allowed_type, mock_allowed_file, 
                                        mock_request, mock_batch):
        """Test the upload_document route with an image file"""
        # Setup mocks
        mock_file = MagicMock()
        mock_file.filename = 'test.jpg'
        mock_request.files = {'file': mock_file}
        
        mock_allowed_file.return_value = True
        mock_allowed_type.return_value = True
        
        # Mock encode_document to return a list of base64 images
        mock_encode.return_value = ["base64encodedimage1", "base64encodedimage2"]
        
        # Mock batch_images
        mock_batch.return_value = [["base64encodedimage1"], ["base64encodedimage2"]]
        
        # Mock the GPT response
        mock_gpt_response = MagicMock()
        mock_gpt_response.json.return_value = {"response": "GPT analyzed content"}
        
        # Mock the embedding response
        mock_embedding_response = MagicMock()
        mock_embedding_response.json.return_value = {"embedding": [0.1, 0.2, 0.3]}
        
        # Setup the post calls to return different responses for different endpoints
        def mock_post_side_effect(url, **kwargs):
            if "get_image_description" in url:
                return mock_gpt_response
            elif "generate_embeddings" in url:
                return mock_embedding_response
        
        mock_post.side_effect = mock_post_side_effect
        
        # Mock the collection
        mock_collection_obj = MagicMock()
        mock_collection.return_value = mock_collection_obj
        
        # Create a context for the test
        with self.app.test_request_context('/upload_document', method='POST'):
            # Need to patch os.remove to prevent actual file deletion
            with patch('os.remove'):
                from document_upload import upload_document
                with patch('flask.abort') as mock_abort:
                    # Execute the function
                    upload_document()
                    
                    # Verify that abort wasn't called
                    mock_abort.assert_not_called()
        
        # Verify the collection add was called
        mock_collection_obj.add.assert_called()

if __name__ == '__main__':
    unittest.main()
