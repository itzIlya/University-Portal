import { Box } from '@mui/material';
import RegistrationForm from '../organisms/RegistrationForm';

/** Full-viewport page with a centred sign-up card */
export default function RegistrationPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        /* subtle gradient instead of flat grey */
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecff 45%, #dfe3ff 100%)',
        px: 2,          // padding when viewport is very narrow
      }}
    >
      <RegistrationForm />
    </Box>
  );
}
