import { Box } from '@mui/material';
import Input from '../atoms/input';
import Typography from '../atoms/Typography';

// Form field molecule with label and input
const FormField = ({ label, error, helperText, ...inputProps }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Input
        label={label}
        error={error}
        helperText={helperText}
        {...inputProps}
      />
    </Box>
  );
};

export default FormField;