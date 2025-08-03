import React from "react";
import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Dashboard", to: "/student" },
  { label: "Semesters", to: "/student/semesters" },

];

export default function StudentNavbar() {
  const { pathname } = useLocation();
  const isActive = (to) =>
    pathname === to || pathname.startsWith(to + "/");

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
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
