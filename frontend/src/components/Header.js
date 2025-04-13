import { AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { LogOut } from 'lucide-react';
import './Header.css';
import { useNavigate } from 'react-router-dom';


export default function Header({ isAuthenticated, onLogout, SERVER_URL }) {
    const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${SERVER_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      onLogout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AppBar position="static" className="gradient-header">
      <Toolbar className="toolbar-content"> 
        <Typography variant="h5" className="logo" onClick={() => {navigate('/');}}>
          Learnify AI
        </Typography>
        {isAuthenticated && (
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogOut />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    </AppBar>
  );
}
