import {
  Box,
  Typography,
  Tabs,
  Tab,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ImportContactsIcon from "@mui/icons-material/ImportContacts";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import AdminNavbar from "../organisms/admin/AdminNavbar";
import AdminCard from "../molecules/AdminCard";
import SemesterPage from "./admin/SemesterPage";
import DepartmentPage from "./admin/DepartmentPage";
import MajorPage from "./admin/MajorPage";
import CourseCreatePage from "./admin/CourseCreatePage";
import CoursePage from "./CoursesPage";
import RoomPage from "./admin/RoomPage";

 import MeetingRoomIcon     from "@mui/icons-material/MeetingRoom";   // ← NEW
/* -------------------------------------------------------------------- */

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
          {/* title */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            mb={3}
          >
            <DashboardIcon color="primary" />
            <Typography variant="h4" fontWeight={700}>
              Admin&nbsp;Portal
            </Typography>
          </Stack>

          {/* create-panels */}
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

          {/* quick links */}
          <Divider sx={{ my: 4 }} />

          <QuickLink
            icon={<PeopleIcon color="primary" />}
            label="View & Edit Users"
            onClick={() => navigate("/admin/members")}
          />

          <Divider sx={{ my: 4 }} />

          {/* ---- Add Rooms ---- */}
          <QuickLink
            icon={<MeetingRoomIcon color="primary" />}
            label="Add Rooms"
            onClick={() => navigate("/admin/rooms")}
          />

          <Divider sx={{ my: 4 }} />


        

          <QuickLink
            icon={<LibraryBooksIcon color="primary" />}
            label="Add Course"
            onClick={() => navigate("/admin/courses")}
          />

          <Divider sx={{ my: 4 }} />

          <QuickLink
            icon={<ImportContactsIcon color="primary" />}
            label="Add Presented Course"
            onClick={() => navigate("/admin/presented")}
          />
        </Box>
      ) : (
        /* nested routed pages render here */
        <Outlet />
      )}
    </Box>
  );
}

/* ───────── helper component for a clickable card ───────── */
function QuickLink({ icon, label, onClick }) {
  return (
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
      onClick={onClick}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {icon}
        <Typography fontWeight="bold">{label}</Typography>
      </Stack>
      <IconButton color="primary">
        <ArrowForwardIosIcon />
      </IconButton>
    </Stack>
  );
}
