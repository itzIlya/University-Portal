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
  Divider
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import api from "../../../api/axios";

export default function StudentDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [majorName, setMajorName] = useState("");

  // 1) fetch /api/me
  useEffect(() => {
    api.get("/me").then(({ data }) => {
      setProfile(data);
    });
  }, []);

  // 2) once we have profile.mid, fetch student-records → major_name
  useEffect(() => {
    if (!profile?.mid) return;
    api.get("/my-student-records")
      .then(({ data }) => {
        if (data.length > 0) {
          setMajorName(data[0].major_name);
        }
      })
      .catch(() => {});
  }, [profile]);

  if (!profile) {
    return (
      <Box sx={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center" }}>
        <Typography>Loading profile…</Typography>
      </Box>
    );
  }

  // format birthday nicely
  const bday = new Date(profile.birthday).toLocaleDateString();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={2} sx={{ bgcolor: "primary.main" }}>
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: "white" }}>
            Student Portal
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>
        {/* Profile Card */}
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
              <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.light", fontSize: 32 }}>
                {profile?.fname?.[0] || "S"}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" fontWeight={700}>
                {profile?.fname || "—"} {profile?.lname || "—"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            {[
              //["Student ID", profile?.mid || "—"],
              ["National ID", profile?.national_id || "—"],
              ["Major", majorName || "—"],
              ["Birthday", profile?.birthday || "—"],
              ["Username", profile?.username || "—"],
              //["Last Login", profile?.last_login ? new Date(profile.last_login).toLocaleString() : "—"],
            ].map(([label, value]) => (
              <Grid item xs={6} key={label}>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
                <Typography variant="body1" fontWeight={510}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Quick Link to Semesters */}
        <Paper
          onClick={() => navigate("semesters")}
          sx={{
            display: "flex",
            alignItems: "center",
            p: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: theme.shadows[1],
            cursor: "pointer",
            mb: 4,
            "&:hover": { boxShadow: theme.shadows[4] },
          }}
        >
          <CalendarMonthIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography fontWeight="bold">
            View My Semesters
          </Typography>
        </Paper>

        {/* Nested pages render here */}
        <Outlet />
      </Box>
    </Box>
  );
}