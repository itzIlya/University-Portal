
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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import api from "../../../api/axios";
import StudentNavbar from "../../organisms/student/StudentNavbar";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [majorName, setMajorName] = useState("");
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

  // Load profile + initialize form
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
    api
      .get("/my-student-records")
      .then(({ data }) => data[0] && setMajorName(data[0].major_name))
      .catch(() => {});
  }, []);

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
      }}
    >
      <StudentNavbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", my: { xs: 4, md: 6 }, px: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
        >
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: 4,
              bgcolor: "background.paper",
              mb: 4,
            }}
          >
            {/* Top row: avatar, name, edit button */}
            <Grid container alignItems="center" spacing={2}>
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

              <Grid item>
                <Button size="small" onClick={() => setEditing((e) => !e)}>
                  {editing ? "Cancel" : "Edit Personal Info"}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ bgcolor: "grey.300", my: 2 }} />
              </Grid>

              {/* Body */}
              {editing ? (
                <>
                  {error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{error}</Alert>
                    </Grid>
                  )}
                  {[
                    "fname",
                    "lname",
                    "national_id",
                    "birthday",
                    "username",
                  ].map((key) => {
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
                          label={labels[key]}
                          type={key === "birthday" ? "date" : "text"}
                          InputLabelProps={
                            key === "birthday" ? { shrink: true } : {}
                          }
                          fullWidth
                          value={form[key]}
                          onChange={handleChange(key)}
                        />
                      </Grid>
                    );
                  })}
                  <Grid item xs={12}>
                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="flex-end"
                    >
                      <Button
                        onClick={() => setEditing(false)}
                        disabled={saving}
                      >
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
                <>
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
                        sx={{ color: "text.primary" }}
                      >
                        {val}
                      </Typography>
                    </Grid>
                  ))}
                </>
              )}
            </Grid>
          </Paper>
        </motion.div>

        <Divider sx={{ my: 3, bgcolor: "grey.300" }} />

        {/* Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 },
          }}
        >
          <Stack spacing={2}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
              }}
            >
              <Paper
                onClick={() => navigate("/student/semesters")}
                sx={cardSx}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CalendarMonthIcon
                    sx={{ fontSize: 40, color: "text.primary" }}
                  />
                  <Typography
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                      color: "text.primary",
                    }}
                  >
                    Semesters & Courses
                  </Typography>
                </Stack>
                <IconButton sx={{ color: "primary.main" }}>
                  <ArrowForwardIosIcon />
                </IconButton>
              </Paper>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
              }}
            >
              <Paper
                onClick={() => navigate("/student/transcripts")}
                sx={cardSx}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ReceiptLongIcon
                    sx={{ fontSize: 40, color: "text.primary" }}
                  />
                  <Typography
                    fontWeight="bold"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                      color: "text.primary",
                    }}
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

const cardSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  p: 3,
  borderRadius: 2,
  bgcolor: "background.paper",
  boxShadow: 2,
  cursor: "pointer",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: 4,
    bgcolor: "primary.light",
    "& .MuiTypography-root": { color: "primary.main" },
    "& .MuiSvgIcon-root": { color: "primary.dark" },
  },
};
