// src/components/pages/student/StudentDashboard.jsx

import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Avatar,
  useTheme,
  Grid,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import api from "../../../api/axios";


export default function StudentDashboard() {
  const theme   = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile]     = useState(null);
  const [majorName, setMajorName] = useState("");

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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Top bar */}
      <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ color: "white" }}>
            Student Portal
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>
        {/* Profile card */}
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: theme.shadows[3],
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
                }}
              >
                {profile.fname?.[0] || "S"}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" fontWeight={700}>
                {profile.fname} {profile.lname}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
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
                <Typography variant="body1" fontWeight={500}>
                  {val}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>


        <Divider sx={{ my: 3 }} />

        {/* Quick-link to Semesters & Courses */}
        <Paper
          onClick={() => navigate("/student/semesters")}
          sx={{
            display: "flex",
            alignItems: "center",
            p: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 1,
            cursor: "pointer",
            "&:hover": { boxShadow: 4 },
          }}
        >
          <CalendarMonthIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography fontWeight="bold">Semesters & Courses</Typography>
        </Paper>

        {/* horizontal divider */}
        <Divider sx={{ my: 3 }} />

        {/* Quick-link to Transcripts */}
        <Paper
          onClick={() => navigate("/student/transcripts/")}
          sx={{
            display: "flex",
            alignItems: "center",
            p: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 1,
            cursor: "pointer",
            "&:hover": { boxShadow: 4 },
          }}
        >
          <ReceiptLongIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography fontWeight="bold">View Transcripts</Typography>
        </Paper>
      </Box>
    </Box>
  );
}
