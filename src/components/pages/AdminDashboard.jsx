import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DashboardIcon  from "@mui/icons-material/Dashboard";
import AdminNavbar    from "../organisms/admin/AdminNavbar";
import AdminCard from "../atoms/AdminCard";
import SemesterPage   from "./admin/SemesterPage";
import DepartmentPage from "./admin/DepartmentPage";
import MajorPage      from "./admin/MajorPage";

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const atRoot = pathname === "/admin" || pathname === "/admin/";
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AdminNavbar />

      {atRoot ? (
        <Box sx={{ maxWidth: 900, mx: "auto", py: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="center" mb={4}>
            <DashboardIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h4" fontWeight={700}>Admin Portal</Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            centered
            sx={{ mb: 4, "& .MuiTabs-indicator": { bgcolor: "primary.main" } }}
          >
            <Tab label="Semester" />
            <Tab label="Department" />
            <Tab label="Major" />
          </Tabs>

          <AdminCard>
            {tab === 0 && <SemesterPage isFormOnly />}
            {tab === 1 && <DepartmentPage isFormOnly />}
            {tab === 2 && <MajorPage isFormOnly />}
          </AdminCard>
        </Box>
      ) : (
        <Outlet />
      )}
    </Box>
  );
}
