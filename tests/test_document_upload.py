import unittest
import os
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock, mock_open
import sys

# Fix the path to properly include the eep module
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Now import from the module
from eep.routes.document_upload import encode_document

class TestDocumentUpload(unittest.TestCase):
    
    def setUp(self):
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        # Clean up the temporary directory
        shutil.rmtree(self.test_dir)
    
    def create_test_file(self, content, extension):
        """Helper method to create test files with specified content and extension"""
        file_path = os.path.join(self.test_dir, f"test_file.{extension}")
        
        # Different file handling based on extension
        if extension == 'pdf':
            # Create a minimal PDF file that can be parsed
            # For tests, we'll still use mocking, but the file should exist
            with open(file_path, 'wb') as f:
                f.write(b'%PDF-1.4\n%EOF\n')  # Minimal PDF structure
        elif extension == 'txt':
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        elif extension == 'docx':
            # Create a placeholder file for docx
            with open(file_path, 'wb') as f:
                f.write(b'PK\x03\x04')  # DOCX files are ZIP archives starting with these bytes
        elif extension in ['jpg', 'jpeg', 'png']:
            # Create a minimal image file
            with open(file_path, 'wb') as f:
                f.write(b'\xFF\xD8\xFF\xE0\x00\x10JFIF\x00')  # JPEG header
                
        return file_path

    @patch('eep.routes.document_upload.PyPDF2.PdfReader')
    def test_pdf_text_extraction(self, mock_pdf_reader):
        """Test that PDF text extraction works correctly"""
        # Setup mock PDF reader
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "This is a test PDF content"
        mock_pdf_reader.return_value.pages = [mock_page]
        
        # Create a test PDF path - actual minimal file will be created
        test_file = self.create_test_file("", "pdf")
        
        # Mock the file open operation specifically for PdfReader
        with patch('builtins.open', mock_open(read_data=b'%PDF-1.4\n%EOF\n')):
            result = encode_document(test_file)
        
        # Assert that the result is the extracted text
        self.assertEqual(result, "This is a test PDF content")
        mock_page.extract_text.assert_called_once()
    
    @patch('eep.routes.document_upload.PyPDF2.PdfReader')
    @patch('eep.routes.document_upload.convert_from_path')
    def test_pdf_fallback_to_images(self, mock_convert, mock_pdf_reader):
        """Test PDF processing falls back to image conversion when text extraction fails"""
        # Setup mock PDF reader to return empty text
        mock_page = MagicMock()
        mock_page.extract_text.return_value = ""
        mock_pdf_reader.return_value.pages = [mock_page]
        
        # Setup mock image conversion
        mock_img = MagicMock()
        mock_buffer = MagicMock()
        mock_img.save.return_value = None
        mock_convert.return_value = [mock_img]
        
        # Mock BytesIO and base64 encode
        with patch('eep.routes.document_upload.BytesIO', return_value=mock_buffer), \
             patch('eep.routes.document_upload.base64.b64encode', return_value=b'test_encoded'), \
             patch('builtins.open', mock_open()):
            
            test_file = self.create_test_file("", "pdf")
            result = encode_document(test_file)
        
        # Check that the result is a list (of encoded images)
        self.assertIsInstance(result, list)
        mock_convert.assert_called_once()
    
    def test_txt_extraction(self):
        """Test that TXT file content is extracted correctly"""
        test_content = "This is a test text file content"
        test_file = self.create_test_file(test_content, "txt")
        
        result = encode_document(test_file)
        
        # Assert that the result is the text content
        self.assertEqual(result, test_content)
    
    @patch('eep.routes.document_upload.Document')
    def test_docx_extraction(self, mock_document):
        """Test that DOCX content is extracted correctly"""
        # Setup mock document with paragraphs
        mock_para1 = MagicMock()
        mock_para1.text = "This is paragraph 1"
        mock_para2 = MagicMock()
        mock_para2.text = "This is paragraph 2"
        
        mock_document.return_value.paragraphs = [mock_para1, mock_para2]
        
        # Create a test DOCX file with placeholder content
        test_file = self.create_test_file("", "docx")
        
        # No need to mock open here since Document handles file opening
        result = encode_document(test_file)
        
        # Assert the result contains both paragraphs
        self.assertEqual(result, "This is paragraph 1\nThis is paragraph 2")
        mock_document.assert_called_once_with(test_file)
    
    @patch('eep.routes.document_upload.Image.open')
    def test_image_processing(self, mock_image_open):
        """Test that image files are processed correctly"""
        # Setup mock image
        mock_img = MagicMock()
        mock_img.mode = "RGB"
        mock_buffer = MagicMock()
        mock_image_open.return_value = mock_img
        
        # Create a test image file path
        test_file = os.path.join(self.test_dir, "test_image.jpg")
        
        # Mock BytesIO and base64 encode
        with patch('eep.routes.document_upload.BytesIO', return_value=mock_buffer), \
             patch('eep.routes.document_upload.base64.b64encode', return_value=b'test_encoded'):
            
            result = encode_document(test_file)
        
        # Check that the result is a list with one encoded image
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)
        mock_image_open.assert_called_once_with(test_file)

if __name__ == '__main__':
    unittest.main()
