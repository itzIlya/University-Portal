import {
  Box, Typography, Tabs, Tab, Button, Stack, Divider, IconButton
} from "@mui/material";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon    from "@mui/icons-material/People";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AdminNavbar   from "../organisms/admin/AdminNavbar";
import AdminCard     from "../molecules/AdminCard";
import SemesterPage  from "./admin/SemesterPage";
import DepartmentPage from "./admin/DepartmentPage";
import MajorPage     from "./admin/MajorPage";

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const atRoot = pathname === "/admin" || pathname === "/admin/";
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AdminNavbar />

      {atRoot ? (
        <Box sx={{ maxWidth: 900, mx: "auto", py: 4 }}>
          {/* ---------- title --------- */}
          <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
            <DashboardIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h4" fontWeight={700}>Admin Portal</Typography>
          </Box>

          {/* ---------- create panels (tabs) --------- */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            centered
            sx={{ mb: 4, "& .MuiTabs-indicator": { bgcolor: "primary.main" } }}
          >
            <Tab label="Semester"   />
            <Tab label="Department" />
            <Tab label="Major"      />
          </Tabs>

          <AdminCard>
            {tab === 0 && <SemesterPage isFormOnly />}
            {tab === 1 && <DepartmentPage isFormOnly />}
            {tab === 2 && <MajorPage isFormOnly />}
          </AdminCard>

          {/* ---------- divider --------- */}
          <Divider sx={{ my: 4 }} />

          {/* ---------- View & Edit Users link --------- */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: "background.paper",
              boxShadow: 1,
              cursor: "pointer",
              "&:hover": { boxShadow: 3 },
            }}
            onClick={() => navigate("/admin/members")}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <PeopleIcon color="primary" />
              <Typography variant="text" fontWeight='bold'>
                View&nbsp;&amp;&nbsp;Edit&nbsp;Users
              </Typography>
            </Stack>

            <IconButton
              color="primary"
              onClick={() => navigate("/admin/members")}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </Stack>
        </Box>
      ) : (
        <Outlet />
      )}
    </Box>
  );
}
