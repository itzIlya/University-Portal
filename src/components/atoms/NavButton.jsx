import { Button as MuiButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/** Small wrapper so navbar buttons inherit primary colour & spacing */
export default function NavButton({ to, children }) {
  return (
    <MuiButton
      component={RouterLink}
      to={to}
      color="inherit"
      sx={{ textTransform: 'none', mx: 1 }}
    >
      {children}
    </MuiButton>
  );
}
