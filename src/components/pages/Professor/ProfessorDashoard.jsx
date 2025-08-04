// src/components/pages/professor/ProfessorDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Typography, Box, Paper, Avatar,
  useTheme, Grid, Divider, Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import ProfessorNavbar from "../../organisms/Professor/ProfessorNavbar";

export default function ProfessorDashboard() {
  const theme   = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [dept, setDept]       = useState("");

  // load my profile
  useEffect(() => {
    api.get("/me").then(({ data }) => setProfile(data));
  }, []);

  // load my department from staff list
  useEffect(() => {
    if (!profile) return;
    api.get("/staff?role=PROF")
      .then(({ data }) => {
        const me = data.find(
          (p) =>
            p.fname === profile.fname && p.lname === profile.lname
        );
        setDept(me?.department_name || "");
      })
      .catch(() => {});
  }, [profile]);

  if (!profile) {
    return (
      <Box
        sx={{
          display: "flex", height: "100vh",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Typography>Loading profile…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <ProfessorNavbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>
        <Paper
          sx={{
            p: 4, borderRadius: 2,
            boxShadow: theme.shadows[3],
            mb: 4,
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 80, height: 80,
                  bgcolor: "primary.light",
                  fontSize: 32,
                }}
              >
                {profile.fname?.[0] || "P"}
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
              ["Department", dept || "—"],
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

        <Paper
          onClick={() => navigate("/professor/sections")}
          sx={{
            display: "flex", alignItems: "center",
            p: 3, borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 1, cursor: "pointer",
            "&:hover": { boxShadow: 4 },
          }}
        >
          <Typography fontWeight="bold">View My Sections</Typography>
        </Paper>

        {/* nested child routes will render here */}
    
      </Box>
    </Box>
  );
}
