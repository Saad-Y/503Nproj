import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

export default function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);

  if (!quiz) {
    return (
      <Box p={4}>
        <Typography variant="h6" color="error">
          ⚠️ No quiz data found.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/generate-quiz-from-doc')}>
          Go Back
        </Button>
      </Box>
    );
  }

  const handleSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
    });
    return score;
  };

  const getWrongAnswers = () =>
    quiz
      .map((q, i) => ({
        question: q.question,
        selected: answers[i],
        correct: q.answer,
        index: i,
      }))
      .filter(res => res.selected !== res.correct);

  const fetchInsights = async () => {
    const wrongAnswers = getWrongAnswers().map(({ question, correct, index }) => ({
      question,
      correct_answer: quiz[index].options[correct],
    }));

    if (!SERVER_URL) {
      console.error('SERVER_URL is not defined. Please set REACT_APP_SERVER_URL in your environment variables.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/generate_insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wrong_answers: wrongAnswers }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} className="dashboard-bg">
      <Typography variant="h4" mb={4}>
        🧠 Your Quiz
      </Typography>

      <Grid container spacing={3}>
        {quiz.map((q, i) => (
          <Grid item xs={12} key={i}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {i + 1}. {q.question}
                </Typography>
                <RadioGroup
                  value={answers[i]}
                  onChange={(e) => handleSelect(i, parseInt(e.target.value, 10))}
                >
                  {q.options.map((opt, j) => {
                    let bgColor = '';
                    if (submitted) {
                      if (j === q.answer) bgColor = '#c8f7c5';
                      else if (j === answers[i]) bgColor = '#f9c0c0';
                    }

                    return (
                      <Box
                        key={j}
                        sx={{
                          backgroundColor: bgColor,
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <FormControlLabel
                          value={j}
                          control={<Radio disabled={submitted} />}
                          label={opt}
                        />
                      </Box>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!submitted ? (
        <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 4 }}>
          Submit Quiz
        </Button>
      ) : (
        <>
          <Box mt={4}>
            <Typography variant="h5">
              ✅ Score: {calculateScore()} / {quiz.length}
            </Typography>
          </Box>
          {getWrongAnswers().length > 0 && (
            <Box mt={3}>
              <Typography variant="h6">❌ Review These Questions:</Typography>
              <ul>
                {getWrongAnswers().map((q, i) => (
                  <li key={i}>
                    <strong>Q:</strong> {q.question}
                    <br />
                    <strong>Your Answer:</strong> {q.selected !== undefined ? quiz[i].options[q.selected] : 'None'}
                    <br />
                    <strong>Correct Answer:</strong> {quiz[i].options[q.correct]}
                    <br />
                  </li>
                ))}
              </ul>
              <Button
                variant="contained"
                color="primary"
                onClick={fetchInsights}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
                sx={{ mt: 2 }}
              >
                {loading ? 'Loading...' : 'Get Insights'}
              </Button>
              {insights.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6">💡 Insights:</Typography>
                  <ul>
                    {insights.map((insight, i) => (
                      <li key={i}>
                        <strong>Q:</strong> {insight.question}
                        <br />
                        <strong>Insight:</strong> {insight.insight}
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
