import { Button as MuiButton } from "@mui/material";

// Reusable MUI button with custom theme
const Button = ({
  children,
  variant = "contained",
  color = "primary",
  ...props
}) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      sx={{
        borderRadius: 3, // Matches theme.shape.borderRadius (12px)
        textTransform: "none",
        fontWeight: 600,
        padding: "8px 16px",
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
