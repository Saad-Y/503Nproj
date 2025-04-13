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
  const [loading, setLoading] = useState("");
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
        setLoading("");
      })
      .catch((err) => {
        console.error('Failed to fetch documents', err);
        setLoading("An error occured.");
      });
  }, [SERVER_URL]);

  // Handle quiz generation
  const handleGenerateQuiz = (docId) => {
    setSelectedDocId(docId);
    setLoading("Loading...");
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
        setLoading("");
        let rawQuiz = data.quiz;

        // Remove markdown code fencing if it exists
        if (typeof rawQuiz === 'string' && rawQuiz.startsWith('```')) {
        rawQuiz = rawQuiz.replace(/```(?:json)?\n?/, '').replace(/```$/, '');
        }

        const quizArray = JSON.parse(rawQuiz);
        navigate('/quiz', { state: { quiz: quizArray } });
      })
      .catch((err) => {
        console.error('Failed to generate quiz', err);
      });
  };

  return (
    <Box p={4} className="dashboard-bg">
      <Typography variant="h4" mb={3}>
        📄 Select a Document to Generate Quiz
      </Typography>
      <Typography variant="body2" align="center" sx={{ mt: 2, marginBottom:2}}>
          {loading}
    </Typography>

      {loading ? (
        <></>
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
