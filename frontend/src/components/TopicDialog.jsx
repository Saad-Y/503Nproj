import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Typography
  } from '@mui/material';
import {useState} from 'react'

export default function TopicDialog({topicOpen, setTopicOpen, topic, setTopic, navigate , SERVER_URL}) {

const [loading, setLoading] = useState("");

function cleanAndExtractJSON(rawQuiz) {
  // Remove all markdown code fences
  const cleaned = rawQuiz.replace(/```json|```/g, '');

  // Match the first valid JSON array
  const match = cleaned.match(/\[\s*{[\s\S]*?}\s*\]/);

  if (!match) throw new Error("No valid JSON array found.");
  const safe = match[0].replace(/\\(?!["\\/bfnrtu])/g, '');
  return JSON.parse(match[0]);
}

return(
<Dialog open={topicOpen} onClose={() => setTopicOpen(false)}>
  <DialogTitle>Enter a Topic</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Type in a topic you'd like to generate a quiz about.
    </DialogContentText>
    <TextField
      autoFocus
      margin="dense"
      label="Topic"
      type="text"
      fullWidth
      variant="standard"
      value={topic}
      onChange={(e) => setTopic(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setTopicOpen(false)}>Cancel</Button>
    <Button
      onClick={async () => {
        try {
            setLoading("Loading...")
          const res = await fetch(`${SERVER_URL}/generate_quiz`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic }),
          });
          const data = await res.json();
          let rawQuiz = data.quiz;
          const quizArray = cleanAndExtractJSON(rawQuiz);
          navigate('/quiz', { state: { quiz: quizArray } });
        } catch (err) {
          console.error('Failed to generate quiz:', err);
          setLoading("An error occured.")
        }
      }}
    >
      Generate Quiz
    </Button>
  </DialogActions>
  <Typography variant="body2" align="center" sx={{ mt: 2, marginBottom:2}}>
          {loading}
    </Typography>
</Dialog>

)
}
