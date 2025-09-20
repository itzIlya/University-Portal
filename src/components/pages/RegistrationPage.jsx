import { Box } from '@mui/material';
import RegistrationForm from '../organisms/RegistrationForm';

export default function RegistrationPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecff 45%, #dfe3ff 100%)',
        px: 2,   
      }}
    >
      <RegistrationForm />
    </Box>
  );
}
