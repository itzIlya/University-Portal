import { Box, Typography, Tabs, Tab, Paper } from "@mui/material";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminNavbar from "../organisms/admin/AdminNavbar";
import SemesterPage from "./admin/SemesterPage";
import DepartmentPage from "./admin/DepartmentPage";
import MajorPage from "./admin/MajorPage";

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const atRoot = pathname === "/admin" || pathname === "/admin/";
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AdminNavbar />
      {atRoot ? (
        <Box sx={{ maxWidth: 800, mx: "auto", p: 4 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" mb={4}>
            Admin Management
          </Typography>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ mb: 4 }}
          >
            <Tab label="Create Semester" />
            <Tab label="Create Department" />
            <Tab label="Create Major" />
          </Tabs>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2 }}>
            {tabValue === 0 && <SemesterPage isFormOnly />}
            {tabValue === 1 && <DepartmentPage isFormOnly />}
            {tabValue === 2 && <MajorPage isFormOnly />}
          </Paper>
        </Box>
      ) : (
        <Outlet />
      )}
    </Box>
  );
}