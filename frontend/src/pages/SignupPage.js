import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function SignupPage({SERVER_URL}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      setSnackbar({ open: true, message: 'Signup successful!', severity: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      setSnackbar({ open: true, message: 'Signup failed!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-container">
      <Paper elevation={10} className="login-paper">
        <Typography variant="h4" color="black" gutterBottom textAlign="center">
          Sign Up for Learnify
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          InputLabelProps={{ style: { color: '#bbb' } }}
          InputProps={{ style: { color: 'black' } }}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputLabelProps={{ style: { color: '#bbb' } }}
          InputProps={{ style: { color: 'black' } }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSignup}
          className="login-button"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
        </Button>
        <Typography mt={2} color="black" textAlign="center">
          Already have an account?{' '}
          <Link href="/" color="primary">
            Log in
          </Link>
        </Typography>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
