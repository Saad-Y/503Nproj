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
import './LoginPage.css';

export default function LoginPage({setIsAuthenticated, SERVER_URL}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      setSnackbar({ open: true, message: 'Login successful!', severity: 'success' });
      setIsAuthenticated(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      setSnackbar({ open: true, message: 'Login failed!', severity: 'error' });
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-container">
      <Paper elevation={6} className="login-paper">
        <Typography variant="h4" className="login-title">
          Login to Learnify
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogin}
          className="login-button"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
        </Button>
        <Typography variant="body2" className="signup-text">
          Don’t have an account?{' '}
          <Link href="/signup" underline="hover">
            Sign up
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
