import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Stack
} from '@mui/material';
import { Upload } from 'lucide-react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import TopicDialog from '../components/TopicDialog'
import UploadDocument from './UploadDocument';

export default function Dashboard({ SERVER_URL }) {
  const [recommendations, setRecommendations] = useState([
    { title: 'Supplementary Quiz: Logic Fundamentals', type: 'quiz' },
    { title: 'Review Notes: Data Structures', type: 'notes' },
    { title: 'Quiz: AI Ethics Basics', type: 'quiz' },
  ]);
  const navigate = useNavigate();
  const [topicOpen, setTopicOpen] = useState(false);
  const [topic, setTopic] = useState('');


  return (
    <Box p={3} className="dashboard-bg">
      <Grid container spacing={3} justifyContent="center">
        {/* Upload Document */}
        <Grid item xs={12} md={10} lg={8}>
          <Card className="dashboard-card center-card">
            <CardContent>
            <Grid item xs={12} md={10} lg={8}>
              <Card className="dashboard-card">
                <CardContent>
                  {/* Other content here... */}
                  <UploadDocument SERVER_URL={SERVER_URL} />
                </CardContent>
              </Card>
            </Grid>

            </CardContent>
          </Card>
        </Grid>

        {/* Quiz Generator & Notes Section */}
        <Grid item container spacing={3} xs={12} md={10} lg={8}>
          <Grid item xs={12} md={6}>
              <Card className="dashboard-card" style={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2} justifyContent="center" sx={{ minHeight: '250px' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      🧪 Generate a Quiz
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate('/generate-quiz-from-doc')}>
                      From Document
                    </Button>
                    <Button variant="outlined" onClick={() => setTopicOpen(true)}>
                      From Topic
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card" style={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2} justifyContent="center" sx={{ minHeight: '250px' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    📝 Fetch Notes
                  </Typography>
                  <Button variant="outlined" color="info" fullWidth>
                    From Document
                  </Button>
                  <Button variant="outlined" color="info" fullWidth>
                    From Topic
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={10} lg={8}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🤖 Insights & Recommendations
              </Typography>
              <Grid container spacing={3} mt={1}>
                {recommendations.map((rec, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card className="recommendation-card">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {rec.title}
                        </Typography>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          sx={{ mt: 2 }}
                        >
                          View {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <TopicDialog setTopic={setTopic} topic={topic} navigate={navigate} setTopicOpen={setTopicOpen} topicOpen={topicOpen} SERVER_URL={SERVER_URL}/>
    </Box>
  );
}
