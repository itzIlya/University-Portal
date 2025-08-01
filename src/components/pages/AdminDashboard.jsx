import {
  Box, Typography, Stack, Divider, IconButton,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardIcon      from "@mui/icons-material/Dashboard";
import PeopleIcon         from "@mui/icons-material/People";
import CalendarMonthIcon  from "@mui/icons-material/CalendarMonth";
import BusinessIcon       from "@mui/icons-material/Business";
import SchoolIcon         from "@mui/icons-material/School";
import MeetingRoomIcon    from "@mui/icons-material/MeetingRoom";
import LibraryBooksIcon   from "@mui/icons-material/LibraryBooks";
import ImportContactsIcon from "@mui/icons-material/ImportContacts";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import AdminNavbar from "../organisms/admin/AdminNavbar";
import AdminCard   from "../molecules/AdminCard";

/* ——————————————————————————————————————————————— */

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const atRoot       = pathname === "/admin" || pathname === "/admin/";

  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"background.default" }}>
      <AdminNavbar />

      {atRoot ? (
        <Box sx={{ maxWidth:900, mx:"auto", py:4 }}>
          {/* title */}
          <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
            <DashboardIcon color="primary"/>
            <Typography variant="h4" fontWeight={700}>Admin&nbsp;Portal</Typography>
          </Stack>

          {/* quick-links */}
          <AdminCard>
            <Stack spacing={4}>
              <QuickLink
                icon={<PeopleIcon color="primary"/>}
                label="View & Edit Users"
                onClick={()=>navigate("/admin/members")}
              />

              <Divider/>

              {/* NEW  — semester / dept / major */}
              <QuickLink
                icon={<CalendarMonthIcon color="primary"/>}
                label="Add Semester"
                onClick={()=>navigate("/admin/semesters")}
              />

              <Divider/>

              <QuickLink
                icon={<BusinessIcon color="primary"/>}
                label="Add Department"
                onClick={()=>navigate("/admin/departments")}
              />

              <Divider/>

              <QuickLink
                icon={<SchoolIcon color="primary"/>}
                label="Add Major"
                onClick={()=>navigate("/admin/majors")}
              />

              <Divider/>

              <QuickLink
                icon={<MeetingRoomIcon color="primary"/>}
                label="Add Rooms"
                onClick={()=>navigate("/admin/rooms")}
              />

              <Divider/>

              <QuickLink
                icon={<LibraryBooksIcon color="primary"/>}
                label="Add Course"
                onClick={()=>navigate("/admin/courses")}
              />

              <Divider/>

              <QuickLink
                icon={<ImportContactsIcon color="primary"/>}
                label="Add Presented Course"
                onClick={()=>navigate("/admin/presented")}
              />
            </Stack>
          </AdminCard>
        </Box>
      ) : (
        /* nested routes render here */
        <Outlet />
      )}
    </Box>
  );
}

/* helper card */
function QuickLink({ icon, label, onClick }) {
  return (
    <Stack
      direction="row" alignItems="center" justifyContent="space-between"
      sx={{
        p:3, borderRadius:2, bgcolor:"background.paper", boxShadow:1,
        cursor:"pointer", "&:hover":{ boxShadow:3 },
      }}
      onClick={onClick}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {icon}
        <Typography fontWeight="bold">{label}</Typography>
      </Stack>
      <IconButton color="primary"><ArrowForwardIosIcon/></IconButton>
    </Stack>
  );
}
