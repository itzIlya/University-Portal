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
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ImportContactsIcon from "@mui/icons-material/ImportContacts";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AdminNavbar from "../organisms/admin/AdminNavbar";
import AdminCard from "../molecules/AdminCard";
import api from "../../api/axios";

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const atRoot = pathname === "/admin" || pathname === "/admin/";

  // Profile state
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fname: "", lname: "", national_id: "", birthday: "", username: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Animation variants for fade-in
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  };

  // load profile
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

  if (!profile && atRoot) {
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #adbde5 0%, #adbde5 60%, #f3f4f6 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AdminNavbar />

      {atRoot ? (
        <Box sx={{ maxWidth: 900, mx: "auto", py: { xs: 4, md: 6 } }}>
          {/* Profile Card */}
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Paper
              sx={{ p: 4, borderRadius: 3, boxShadow: 4, bgcolor: "background.paper", mb: 4 }}
            >
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.light", fontSize: 32, color: "text.primary" }}>
                    {profile.fname?.[0] || "A"}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h5" fontWeight={700}>
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
                {editing ? (
                  <>                
                    {error && (
                      <Grid item xs={12}>
                        <Alert severity="error">{error}</Alert>
                      </Grid>
                    )}
                    {Object.entries(form).map(([key, val]) => {
                      const labels = { fname: "First Name", lname: "Last Name", national_id: "National ID", birthday: "Birthday", username: "Username" };
                      return (
                        <Grid item xs={12} md={6} key={key}>
                          <TextField
                            fullWidth
                            label={labels[key]}
                            type={key === "birthday" ? "date" : "text"}
                            InputLabelProps={key === "birthday" ? { shrink: true } : {}}
                            value={val}
                            onChange={handleChange(key)}
                          />
                        </Grid>
                      );
                    })}
                    <Grid item xs={12}>
                      <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button onClick={() => setEditing(false)} disabled={saving}>
                          Cancel
                        </Button>
                        <Button variant="contained" onClick={saveProfile} disabled={saving}>
                          {saving ? <CircularProgress size={20} /> : "Save"}
                        </Button>
                      </Stack>
                    </Grid>
                  </>
                ) : (
                  Object.entries({ "National ID": profile.national_id, Birthday: profile.birthday ? new Date(profile.birthday).toLocaleDateString() : "—", Username: profile.username }).map(
                    ([label, val]) => (
                      <Grid item xs={12} md={6} key={label}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography variant="body1">{val || "—"}</Typography>
                      </Grid>
                    )
                  )
                )}
              </Grid>
            </Paper>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
          >
            <AdminCard sx={{ bgcolor: "background.paper", borderRadius: 3, p: 3, boxShadow: 4 }}>
              <Stack spacing={2}>
                <motion.div variants={fadeIn}>
                  <QuickLink icon={<PeopleIcon sx={{ color: "text.primary" }} />} label="View & Edit Users" onClick={() => navigate("/admin/members")} />
                </motion.div>
                <Divider sx={{ bgcolor: "grey.300" }} />
                <motion.div variants={fadeIn}>
                  <QuickLink icon={<CalendarMonthIcon sx={{ color: "text.primary" }} />} label="Add Semester" onClick={() => navigate("/admin/semesters")} />
                </motion.div>
                <Divider sx={{ bgcolor: "grey.300" }} />
                <motion.div variants={fadeIn}>
                  <QuickLink icon={<BusinessIcon sx={{ color: "text.primary" }} />} label="Add Department" onClick={() => navigate("/admin/departments")} />
                </motion.div>
                <Divider sx={{ bgcolor: "grey.300" }} />
                <motion.div variants={fadeIn}>
                  <QuickLink icon={<SchoolIcon sx={{ color: "text.primary" }} />} label="Add Major" onClick={() => navigate("/admin/majors")} />
                </motion.div>
                <Divider sx={{ bgcolor: "grey.300" }} />
                <motion.div variants={fadeIn}>
                  <QuickLink icon={<MeetingRoomIcon sx={{ color: "text.primary" }} />} label="Add Rooms" onClick={() => navigate("/admin/rooms")} />
                </motion.div>
                <Divider sx={{ bgcolor: "grey.300" }} />
                <motion.div variants={fadeIn}>
                  <QuickLink icon={<LibraryBooksIcon sx={{ color: "text.primary" }} />} label="Add Course" onClick={() => navigate("/admin/courses")} />
                </motion.div>
                <Divider sx={{ bgcolor: "grey.300" }} />
                <motion.div variants={fadeIn}>
                  <QuickLink icon={<ImportContactsIcon sx={{ color: "text.primary" }} />} label="Add Presented Course" onClick={() => navigate("/admin/presented")} />
                </motion.div>
              </Stack>
            </AdminCard>
          </motion.div>
        </Box>
      ) : (
        <Outlet />
      )}
    </Box>
  );
}

// Helper QuickLink
function QuickLink({ icon, label, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} whileTap={{ scale: 0.98 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper", boxShadow: 2, cursor: "pointer", "&:hover": { boxShadow: 4, bgcolor: "primary.light", "& .MuiTypography-root": { color: "primary.main" }, "& .MuiSvgIcon-root": { color: "primary.dark" } }, transition: "all 0.3s ease" }} onClick={onClick}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {icon}
          <Typography fontWeight="bold" sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, color: "text.primary" }}>{label}</Typography>
        </Stack>
        <IconButton sx={{ color: "primary.main" }}><ArrowForwardIosIcon /></IconButton>
      </Stack>
    </motion.div>
  );
}
