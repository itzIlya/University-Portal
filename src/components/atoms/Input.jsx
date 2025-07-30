import { TextField } from '@mui/material';

// Reusable MUI text field
const Input = ({ label, type = 'text', error, helperText, ...props }) => {
  return (
    <TextField
      label={label}
      type={type}
      variant="outlined"
      fullWidth
      error={error}
      helperText={helperText}
      sx={{ mb: 2 }}
      {...props}
    />
  );
};

export default Input;