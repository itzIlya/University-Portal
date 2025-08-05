import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

const navLinks = [
  { label: "Dashboard", to: "/admin" },
  //{ label: "Profile", to: "/admin/profile" },
   
  
  // { label: "Semesters",   to: "/admin/semesters" },
  // { label: "Departments", to: "/admin/departments" },
  // { label: "Majors",      to: "/admin/majors" },
  // { label: "Members",     to: "/admin/members" },
];

export default function AdminNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (to) =>
    pathname === to || pathname.startsWith(to + "/");

  const handleLogout = async () => {
    try {
      await api.post("/signout");
    } catch (err) {
      console.error("Error signing out:", err);
    }
    logout();
    navigate("/", { replace: true });
  };

  return (
    <AppBar position="static" elevation={2} sx={{ bgcolor: "primary.main" }}>
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: "white" }}>
          Admin&nbsp;Dashboard
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
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