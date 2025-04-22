import React, { useState } from 'react';
import {
  Button, Stack, Typography, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Upload } from 'lucide-react';

export default function UploadDocument({ SERVER_URL }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('parsable');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTypeChange = (event, newType) => {
    if (newType !== null) setDocType(newType);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const endpoint = docType === 'parsable' ? '/upload_document_parsable' : '/upload_document_non_parsable';
      const response = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      //const result = await response.json();
      if (response.ok) {
        setMessage('Upload successful!');
      } 
      else if (response.status === 413) {
        setMessage('Upload failed: File too large.');
      }
      else {
        setMessage('Upload failed.');
      }
    } catch (error) {
      setMessage('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={2} alignItems="center" mt={3}>
      <Typography variant="h6">Upload Document</Typography>
      <ToggleButtonGroup
        value={docType}
        exclusive
        onChange={handleTypeChange}
        aria-label="document type"
      >
        <ToggleButton value="parsable" aria-label="parsable">Parsable</ToggleButton>
        <ToggleButton value="non-parsable" aria-label="non-parsable">Non-Parsable</ToggleButton>
      </ToggleButtonGroup>
      <input type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFileChange} />
      <Button
        variant="contained"
        color="primary"
        startIcon={<Upload />}
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
      {message && <Typography>{message}</Typography>}
    </Stack>
  );
}
