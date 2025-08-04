import {
  Box,
  Stack,
  Typography,
  Divider,
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
import BookIcon from "@mui/icons-material/Book";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AdminNavbar from "../organisms/admin/AdminNavbar";
import AdminCard from "../molecules/AdminCard";

/* ——————————————————————————————————————————————— */

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const atRoot = pathname === "/admin" || pathname === "/admin/";

  // Animation variants for fade-in
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #adbde5 0%, #adbde5 60%, #f3f4f6 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Icons */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          opacity: 0.2,
          transform: "rotate(-10deg)",
        }}
      >
        {/* <BookIcon sx={{ fontSize: 80, color: "primary.contrastText" }} /> */}
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          right: 20,
          opacity: 0.2,
          transform: "rotate(10deg)",
        }}
      >
        <AutoStoriesIcon sx={{ fontSize: 80, color: "primary.contrastText" }} />
      </Box>

      <AdminNavbar />

      {atRoot ? (
        <Box sx={{ maxWidth: 900, mx: "auto", py: { xs: 4, md: 6 } }}>
          {/* Title */}
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              mb={4}
            >
              <SchoolIcon
                sx={{ fontSize: 50, color: "primary.contrastText" }}
              />
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, color: "primary.contrastText" }}
              >
                Admin Portal
              </Typography>
            </Stack>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.1 },
              },
            }}
          >
            <AdminCard sx={{ bgcolor: "background.paper", borderRadius: 3, p: 3, boxShadow: 4 }}>
              <Stack spacing={2}>
                <motion.div variants={fadeIn}>
                  <QuickLink
                    icon={<PeopleIcon sx={{ color: "text.primary" }} />}
                    label="View & Edit Users"
                    onClick={() => navigate("/admin/members")}
                  />
                </motion.div>

                <Divider sx={{ bgcolor: "grey.300" }} />

                <motion.div variants={fadeIn}>
                  <QuickLink
                    icon={<CalendarMonthIcon sx={{ color: "text.primary" }} />}
                    label="Add Semester"
                    onClick={() => navigate("/admin/semesters")}
                  />
                </motion.div>

                <Divider sx={{ bgcolor: "grey.300" }} />

                <motion.div variants={fadeIn}>
                  <QuickLink
                    icon={<BusinessIcon sx={{ color: "text.primary" }} />}
                    label="Add Department"
                    onClick={() => navigate("/admin/departments")}
                  />
                </motion.div>

                <Divider sx={{ bgcolor: "grey.300" }} />

                <motion.div variants={fadeIn}>
                  <QuickLink
                    icon={<SchoolIcon sx={{ color: "text.primary" }} />}
                    label="Add Major"
                    onClick={() => navigate("/admin/majors")}
                  />
                </motion.div>

                <Divider sx={{ bgcolor: "grey.300" }} />

                <motion.div variants={fadeIn}>
                  <QuickLink
                    icon={<MeetingRoomIcon sx={{ color: "text.primary" }} />}
                    label="Add Rooms"
                    onClick={() => navigate("/admin/rooms")}
                  />
                </motion.div>

                <Divider sx={{ bgcolor: "grey.300" }} />

                <motion.div variants={fadeIn}>
                  <QuickLink
                    icon={<LibraryBooksIcon sx={{ color: "text.primary" }} />}
                    label="Add Course"
                    onClick={() => navigate("/admin/courses")}
                  />
                </motion.div>

                <Divider sx={{ bgcolor: "grey.300" }} />

                <motion.div variants={fadeIn}>
                  <QuickLink
                    icon={<ImportContactsIcon sx={{ color: "text.primary" }} />}
                    label="Add Presented Course"
                    onClick={() => navigate("/admin/presented")}
                  />
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

/* Helper card */
function QuickLink({ icon, label, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
          boxShadow: 2,
          cursor: "pointer",
          "&:hover": {
            boxShadow: 4,
            bgcolor: "primary.light",
            "& .MuiTypography-root": { color: "primary.main" },
            "& .MuiSvgIcon-root": { color: "primary.dark" },
          },
          transition: "all 0.3s ease",
        }}
        onClick={onClick}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {icon}
          <Typography
            fontWeight="bold"
            sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, color: "text.primary" }}
          >
            {label}
          </Typography>
        </Stack>
        <IconButton sx={{ color: "primary.main" }}>
          <ArrowForwardIosIcon />
        </IconButton>
      </Stack>
    </motion.div>
  );
}