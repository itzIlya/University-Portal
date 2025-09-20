import { createTheme } from "@mui/material/styles";
import { colors } from "./color";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: colors.primary[700], // 
      light: colors.primary[300],
      dark: colors.primary[900],
      contrastText: "#ffffff",
    },

    secondary: {
      main: colors.secondary[500], // F25626
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: "#ffffff",
    },

    background: {
      default: colors.grey[50],
      paper: "#ffffff",
    },

    text: {
      primary: colors.grey[900],
      secondary: colors.grey[700],
      disabled: colors.grey[500],
    },

    success: { main: colors.success },
    error: { main: colors.error },
    warning: { main: colors.warning },
    info: { main: colors.info },
  },

  // typography block unchanged …
  typography: {
    /* keep your existing sizes */
  },

  shape: { borderRadius: 12 },
});

export default theme;
