import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Dashboard",  to: "/admin" },  
  { label: "Semesters", to: "/admin/semesters" },
  { label: "Departments", to: "/admin/departments" },
  { label: "Majors", to: "/admin/majors" },
];

export default function AdminNavbar() {
  const { pathname } = useLocation();

  return (
    <AppBar position="static" elevation={2} sx={{ bgcolor: "primary.main" }}>
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: "white" }}>
          Admin Dashboard
        </Typography>

        <Stack direction="row" spacing={2}>
          {navLinks.map(({ label, to }) => (
            <Button
              key={to}
              component={RouterLink}
              to={to}
              variant={pathname === to ? "contained" : "outlined"}
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