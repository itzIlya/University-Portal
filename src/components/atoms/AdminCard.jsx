// src/components/atoms/AdminCard.jsx
import { Box, useTheme } from "@mui/material";

/**
 * Re-usable elevated section wrapper without nesting another <Paper>.
 * Keeps the same padding / radius, but uses Box + theme shadow instead.
 */
export default function AdminCard({ children }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4 },
        mb: 4,
        mt:4,
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: theme.shadows[3], // subtle elevation
        maxWidth: 1500, mx: "auto" 
        
      }}
    >
      {children}
    </Box>
  );
}
