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
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

export default function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const quiz = location.state?.quiz;
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState("");
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

  const getWrongAnswers = () => {
    return quiz
      .map((q, i) => ({
        question: q.question,
        selected: answers[i],
        correct: q.answer,
      }))
      .filter((res) => res.selected !== res.correct);
  };

  console.log("Type of quiz:", typeof quiz);
  console.log(quiz);
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
                <Typography variant="h6">{i + 1}. {q.question}</Typography>
                <RadioGroup value={answers[i]} onChange={(e) => handleSelect(i, parseInt(e.target.value))}>
                  {q.options.map((opt, j) => {
                    let bgColor = '';
                    if (submitted) {
                      if (j === q.answer) bgColor = '#c8f7c5'; // green
                      else if (j === answers[i]) bgColor = '#f9c0c0'; // red
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
        <Button variant="contained" onClick={handleSubmit} sx={{ mt: 4 }}>
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
                    <strong>Your Answer:</strong> {q.selected !== undefined ? quiz[i].options[q.selected] : "None"}
                    <br />
                    <strong>Correct Answer:</strong> {quiz[i].options[q.correct]}
                    <br />
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
