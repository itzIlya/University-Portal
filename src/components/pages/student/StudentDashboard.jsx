// src/components/pages/student/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Avatar,
  useTheme,
  Grid,
  Divider,
  Stack,
  IconButton,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import api from "../../../api/axios";
import StudentNavbar from "../../organisms/student/StudentNavbar";

export default function StudentDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [majorName, setMajorName] = useState("");

  // Animation variants for fade-in
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  };

  // 1) load /me
  useEffect(() => {
    api.get("/me").then(({ data }) => setProfile(data));
  }, []);

  // 2) once we have profile.mid, load /my-student-records → major_name
  useEffect(() => {
    if (!profile?.mid) return;
    api.get("/my-student-records")
      .then(({ data }) => {
        if (data.length) setMajorName(data[0].major_name);
      })
      .catch(() => {});
  }, [profile]);

  if (!profile) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>Loading profile…</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #adbde5 0%, #adbde5 60%, #f3f4f6 100%)",
      }}
    >
      {/* Shared navbar */}
      <StudentNavbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", my: { xs: 4, md: 6 }, px: 2 }}>
        {/* Profile Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: 4,
              bgcolor: "background.paper",
              mb: 4,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "primary.light",
                    fontSize: 32,
                    color: "text.primary",
                  }}
                >
                  {profile.fname?.[0] || "S"}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ color: "text.primary" }}
                >
                  {profile.fname} {profile.lname}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ bgcolor: "grey.300", my: 2 }} />
              </Grid>
              {[
                ["National ID", profile.national_id],
                ["Major", majorName || "—"],
                [
                  "Birthday",
                  profile.birthday
                    ? new Date(profile.birthday).toLocaleDateString()
                    : "—",
                ],
                ["Username", profile.username || "—"],
              ].map(([label, val]) => (
                <Grid item xs={12} md={6} key={label}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={500}
                    sx={{ color: "text.primary" }}
                  >
                    {val}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </motion.div>

        <Divider sx={{ bgcolor: "grey.300", my: 3 }} />

        {/* Quick Links */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.1 },
            },
          }}
        >
          <Stack spacing={2}>
            {/* Semesters & Courses */}
            <motion.div variants={fadeIn}>
              <Paper
                onClick={() => navigate("/student/semesters")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  boxShadow: 2,
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: 4,
                    bgcolor: "primary.light",
                    "& .MuiTypography-root": { color: "primary.main" },
                    "& .MuiSvgIcon-root": { color: "primary.dark" },
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CalendarMonthIcon sx={{ fontSize: 40, color: "text.primary" }} />
                  <Typography
                    fontWeight="bold"
                    sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, color: "text.primary" }}
                  >
                    Semesters & Courses
                  </Typography>
                </Stack>
                <IconButton sx={{ color: "primary.main" }}>
                  <ArrowForwardIosIcon />
                </IconButton>
              </Paper>
            </motion.div>

            <Divider sx={{ bgcolor: "grey.300", my: 2 }} />

            {/* Transcripts */}
            <motion.div variants={fadeIn}>
              <Paper
                onClick={() => navigate("/student/transcripts")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  boxShadow: 2,
                  cursor: "pointer",
                  "&:hover": {
                    boxShadow: 4,
                    bgcolor: "primary.light",
                    "& .MuiTypography-root": { color: "primary.main" },
                    "& .MuiSvgIcon-root": { color: "primary.dark" },
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ReceiptLongIcon sx={{ fontSize: 40, color: "text.primary" }} />
                  <Typography
                    fontWeight="bold"
                    sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, color: "text.primary" }}
                  >
                    View Transcripts
                  </Typography>
                </Stack>
                <IconButton sx={{ color: "primary.main" }}>
                  <ArrowForwardIosIcon />
                </IconButton>
              </Paper>
            </motion.div>
          </Stack>
        </motion.div>
      </Box>
    </Box>
  );
}
