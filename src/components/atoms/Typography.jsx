import { Typography as MuiTypography } from '@mui/material';

// Reusable MUI typography component
const Typography = ({ variant = 'body1', color = 'text.primary', children, ...props }) => {
  return (
    <MuiTypography
      variant={variant}
      color={color}
      {...props}
    >
      {children}
    </MuiTypography>
  );
};

export default Typography;