import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';

export default function AllDocuments({ SERVER_URL }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/documents`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this document?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${SERVER_URL}/delete_document/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await res.json();
      if (res.ok) {
        setDocuments((docs) => docs.filter((doc) => doc.id !== docId));
      } else {
        alert(result.error || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <Box p={4} className="dashboard-bg">
      <Typography variant="h4" mb={4}>📁 Your Documents</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid item xs={12} md={6} key={doc.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{doc.title}</Typography>
                  <Typography variant="body2" color="text.secondary">Owner: {doc.owner_username}</Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ mt: 2 }}
                    onClick={() => handleDelete(doc.id)}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
