import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import SignInForm from "../organisms/SignInForm";
import SchoolIcon from "@mui/icons-material/School";

export default function SignInPage() {
  // Animation variants for fade-in
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

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
      <SignInForm  />
      
    </Box>
  );
}