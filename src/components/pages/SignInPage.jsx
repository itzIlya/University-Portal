import { Box } from '@mui/material';
import SignInForm from '../organisms/SignInForm';

export default function SignInPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecff 45%, #dfe3ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <SignInForm />
    </Box>
  );
}