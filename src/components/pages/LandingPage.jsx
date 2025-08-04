import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SchoolIcon from "@mui/icons-material/School";
import BookIcon from "@mui/icons-material/Book";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  // Animation variants for fade-in
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #8ca3d8 0%, #6d83b5 50%, #ffa282 100%)",
        color: "primary.contrastText",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 6, md: 12 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Icons */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          opacity: 0.2,
          transform: "rotate(-10deg)",
        }}
      >
        <BookIcon sx={{ fontSize: 80, color: "primary.contrastText" }} />
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          right: 20,
          opacity: 0.2,
          transform: "rotate(10deg)",
        }}
      >
        <AutoStoriesIcon sx={{ fontSize: 80, color: "primary.contrastText" }} />
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center" justifyContent="center">
          {/* Left column: Text + Buttons */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  px: { xs: 3, md: 4 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: { xs: "1rem", md: "1.2rem" },
                    fontWeight: 300,
                    mb: 2,
                    opacity: 0.8,
                  }}
                >
                  Your Academic Journey Starts Here
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <SchoolIcon sx={{ fontSize: 60, mr: 2, color: "primary.contrastText" }} />
                  <Typography
                    variant="h1"
                    component="h1"
                    fontWeight={800}
                    sx={{ fontSize: { xs: "3rem", sm: "3.8rem", md: "4.5rem" } }}
                  >
                    UniPortal
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  mb={5}
                  sx={{
                    fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" },
                    fontWeight: 300,
                    lineHeight: 1.5,
                    maxWidth: 500,
                    mx: "auto",
                  }}
                >
                  Streamline your education with seamless course enrollment, transcripts, and more.
                </Typography>
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<LoginIcon />}
                    onClick={() => navigate("/signin")}
                    sx={{
                      px: 6,
                      py: 2,
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      borderRadius: 10,
                      bgcolor: "primary.contrastText",
                      color: "primary.main",
                      boxShadow: theme.shadows[5],
                      "&:hover": {
                        bgcolor: "primary.light",
                        boxShadow: theme.shadows[8],
                        transform: "translateY(-3px)",
                        transition: "all 0.3s ease",
                      },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PersonAddIcon />}
                    onClick={() => navigate("/register")}
                    sx={{
                      px: 6,
                      py: 2,
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      borderRadius: 10,
                      borderColor: "primary.contrastText",
                      color: "primary.contrastText",
                      boxShadow: theme.shadows[3],
                      "&:hover": {
                        borderColor: "primary.contrastText",
                        bgcolor: "primary.dark",
                        boxShadow: theme.shadows[5],
                        transform: "translateY(-3px)",
                        transition: "all 0.3s ease",
                      },
                    }}
                  >
                    Register
                  </Button>
                </Box>
              </Box>
            </motion.div>
          </Grid>

          {/* Right column: SVG Image */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  px: { xs: 3, md: 4 },
                }}
              >
                <Box
                  component="img"
                  src="/frame11.svg"
                  alt="Students studying illustration"
                  sx={{
                    width: "100%",
                    maxWidth: { xs: 300, sm: 350, md: 400 },
                    height: "auto",
                    display: "block",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                />
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}