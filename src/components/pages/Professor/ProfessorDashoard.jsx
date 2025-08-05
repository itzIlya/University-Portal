// src/components/pages/professor/ProfessorDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Avatar,
  Grid,
  Divider,
  Stack,
  Button,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SchoolIcon from "@mui/icons-material/School";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import api from "../../../api/axios";
import ProfessorNavbar from "../../organisms/Professor/ProfessorNavbar";

export default function ProfessorDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [dept, setDept] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fname: "",
    lname: "",
    national_id: "",
    birthday: "",
    username: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Animation variants for fade-in
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  };

  // load my profile
  useEffect(() => {
    api.get("/me").then(({ data }) => {
      setProfile(data);
      setForm({
        fname: data.fname || "",
        lname: data.lname || "",
        national_id: data.national_id || "",
        birthday: data.birthday?.split("T")[0] || "",
        username: data.username || "",
      });
    });
  }, []);

  // load my department
  useEffect(() => {
    if (!profile) return;
    api.get("/staff?role=PROF")
      .then(({ data }) => {
        const me = data.find(
          (p) => p.fname === profile.fname && p.lname === profile.lname
        );
        setDept(me?.department_name || "");
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
        <CircularProgress />
      </Box>
    );
  }

  const handleChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("/profile", form);
      setProfile((p) => ({ ...p, ...form }));
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #adbde5 0%, #adbde5 60%, #f3f4f6 100%)",
        position: "relative",
      }}
    >
      <ProfessorNavbar />

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
            <Grid container alignItems="center" spacing={2}>
              {/* Avatar */}
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
                  {profile.fname?.[0] || "P"}
                </Avatar>
              </Grid>

              {/* Name */}
              <Grid item xs>
                <Typography variant="h5" fontWeight={700}>
                  {profile.fname} {profile.lname}
                </Typography>
              </Grid>

              {/* Edit button */}
              <Grid item>
                <Button size="small" onClick={() => setEditing((e) => !e)}>
                  {editing ? "Cancel" : "Edit Personal Info"}
                </Button>
              </Grid>

              {/* Divider full width */}
              <Grid item xs={12}>
                <Divider sx={{ bgcolor: "grey.300", my: 2 }} />
              </Grid>

              {editing ? (
                <>
                  {/* Show validation error */}
                  {error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{error}</Alert>
                    </Grid>
                  )}

                  {/* Editable fields */}
                  {["fname", "lname", "national_id", "birthday", "username"].map(
                    (key) => {
                      const labels = {
                        fname: "First Name",
                        lname: "Last Name",
                        national_id: "National ID",
                        birthday: "Birthday",
                        username: "Username",
                      };
                      return (
                        <Grid item xs={12} md={6} key={key}>
                          <TextField
                            fullWidth
                            label={labels[key]}
                            type={key === "birthday" ? "date" : "text"}
                            InputLabelProps={key === "birthday" ? { shrink: true } : {}}
                            value={form[key]}
                            onChange={handleChange(key)}
                          />
                        </Grid>
                      );
                    }
                  )}

                  {/* Save / Cancel */}
                  <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                      <Button onClick={() => setEditing(false)} disabled={saving}>
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={saveProfile}
                        disabled={saving}
                      >
                        {saving ? <CircularProgress size={20} /> : "Save"}
                      </Button>
                    </Stack>
                  </Grid>
                </>
              ) : (
                /* Static info display */
                [
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
                    <Typography variant="body1">{val}</Typography>
                  </Grid>
                ))
              )}
            </Grid>
          </Paper>
        </motion.div>

        {/* Quick link to sections */}
        <motion.div initial="hidden" animate="visible" variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}>
          <Paper
            onClick={() => navigate("/professor/sections")}
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
              },
              transition: "all 0.3s ease",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <SchoolIcon sx={{ fontSize: 40 }} />
              <Typography fontWeight="bold" sx={{ fontSize: "1.1rem" }}>
                View My Sections
              </Typography>
            </Stack>
            <IconButton>
              <ArrowForwardIosIcon />
            </IconButton>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
}
