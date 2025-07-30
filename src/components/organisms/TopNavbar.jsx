import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import NavButton from '../atoms/NavButton';

export default function TopNavbar() {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Student Portal
        </Typography>

        {/* navigation links */}
        <Box>
          <NavButton to="/">Register</NavButton>
          <NavButton to="/courses">Courses</NavButton>
          <NavButton to="/transcript">Transcript</NavButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
