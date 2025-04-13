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

            // Remove markdown code fencing if it exists
            if (typeof rawQuiz === 'string' && rawQuiz.startsWith('```')) {
            rawQuiz = rawQuiz.replace(/```(?:json)?\n?/, '').replace(/```$/, '');
            }

            const quizArray = JSON.parse(rawQuiz);
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
