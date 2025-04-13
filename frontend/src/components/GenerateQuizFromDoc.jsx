import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function GenerateQuizFromDoc({ SERVER_URL }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const navigate = useNavigate();

  // Fetch documents on load
  useEffect(() => {
    fetch(`${SERVER_URL}/documents`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch documents', err);
        setLoading(false);
      });
  }, [SERVER_URL]);

  // Handle quiz generation
  const handleGenerateQuiz = (docId) => {
    setSelectedDocId(docId);
    

    fetch(`${SERVER_URL}/generate_quiz`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document_id: docId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const quizArray = typeof data.quiz === 'string' ? JSON.parse(data.quiz) : data.quiz;
        navigate('/quiz', { state: { quiz: quizArray } });
      })
      .catch((err) => {
        console.error('Failed to generate quiz', err);
      });
  };

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        📄 Select a Document to Generate Quiz
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid item xs={12} md={6} key={doc.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{doc.title}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => handleGenerateQuiz(doc.id)}
                  >
                    Generate Quiz
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
