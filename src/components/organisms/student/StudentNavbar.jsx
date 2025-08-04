// src/components/organisms/StudentNavbar.jsx
import React from "react";
import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

const navLinks = [
  { label: "Dashboard", to: "/student" },
  // { label: "Semesters",  to: "/student/semesters" },
  // { label: "Transcripts", to: "/student/transcripts" },
];

export default function StudentNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (to) =>
    pathname === to || pathname.startsWith(to + "/");

  const handleLogout = async () => {
    try {
      await api.post("/signout");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
    logout();
    navigate("/", { replace: true });
  };

  return (
    <AppBar position="static" elevation={2} sx={{ bgcolor: "primary.main" }}>
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: "white" }}>
          Student&nbsp;Portal
        </Typography>

        <Stack direction="row" spacing={2}>
          {navLinks.map(({ label, to }) => (
            <Button
              key={to}
              component={RouterLink}
              to={to}
              variant={isActive(to) ? "contained" : "outlined"}
              sx={{
                textTransform: "none",
                color: "white",
                borderColor: "white",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              {label}
            </Button>
          ))}

          <Button
            onClick={handleLogout}
            variant="outlined"
            sx={{
              textTransform: "none",
              color: "white",
              borderColor: "white",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
