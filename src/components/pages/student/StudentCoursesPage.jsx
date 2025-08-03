// src/components/pages/student/StudentCoursesPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import StudentNavbar from "../../organisms/student/StudentNavbar";

export default function StudentCoursesPage() {
  const { sid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recordId, setRecordId] = useState(null);
  const [majorId, setMajorId] = useState(null);
  const [semester, setSemester] = useState(null);
  const [offered, setOffered] = useState([]);
  const [taken, setTaken] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. grab record_id + major_id
  useEffect(() => {
    api
      .get("/my-student-records")
      .then(({ data }) => {
        if (!data.length) {
          throw new Error("No student record found");
        }
        setRecordId(data[0].record_id);
        setMajorId(data[0].major_id);
      })
      .catch((e) => setError(e.message || "Failed to fetch record"));
  }, []);

  // 2. fetch semester info and both lists
  useEffect(() => {
    if (!recordId || !majorId) return;
    setLoading(true);

    Promise.all([
      api.get("/semesters"), // to find if this sid is active
      api.get("/presented-courses", {
        params: { semester_id: sid, major_id: majorId },
      }),
      api.get("/my-taken-courses", { params: { semester_id: sid } }),
    ])
      .then(([semRes, offRes, takenRes]) => {
        const sem = semRes.data.find((s) => s.sid === sid);
        setSemester(sem);
        setOffered(offRes.data);
        setTaken(takenRes.data);
      })
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  }, [recordId, majorId, sid]);

  const isTaken = (pcid) => taken.some((t) => t.pcid === pcid);

  const handleEnroll = (pcid) => {
    api
      .post("/taken-courses", {
        record_id: recordId,
        semester_id: sid,
        pcid,
      })
      .then(() => {
        setTaken((prev) => [...prev, { pcid, status: "TAKING", grade: null }]);
      })
      .catch(() => setError("Failed to enroll"));
  };

  if (loading) {
    return (
      <Stack alignItems="center" py={4}>
        <CircularProgress />
      </Stack>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <StudentNavbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <Typography variant="h5" fontWeight={700}>
            {semester?.sem_title} Courses
          </Typography>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
        <Divider sx={{ mb: 3 }} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
          {/* Offered Courses */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" mb={2}>
              Offered Courses
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Professor</TableCell>
                    <TableCell>Days/Times</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell align="right">Seats</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {offered.map((c) => {
                    const remaining = c.max_capacity - c.capacity;
                    return (
                      <TableRow key={c.pcid}>
                        <TableCell>{c.course_code}</TableCell>
                        <TableCell>{c.course_name}</TableCell>
                        <TableCell>{c.professor}</TableCell>
                        <TableCell>
                          {c.on_days} @ {c.on_times}
                        </TableCell>
                        <TableCell>{c.room}</TableCell>
                        <TableCell align="right">
                          {remaining} / {c.max_capacity}
                        </TableCell>
                        <TableCell align="right">
                          {semester.is_active ? (
                            <Button
                              size="small"
                              variant="contained"
                              disabled={
                                isTaken(c.pcid) || remaining <= 0
                              }
                              onClick={() => handleEnroll(c.pcid)}
                            >
                              {isTaken(c.pcid)
                                ? "Taken"
                                : remaining > 0
                                ? "Enroll"
                                : "Full"}
                            </Button>
                          ) : (
                            <Typography color="text.secondary">
                              Closed
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* My Courses */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" mb={2}>
              My Courses
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Grade</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taken.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        You haven’t enrolled yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    taken.map((t) => (
                      <TableRow key={t.pcid}>
                        <TableCell>{t.course_code}</TableCell>
                        <TableCell>{t.course_name}</TableCell>
                        <TableCell>{t.status}</TableCell>
                        <TableCell align="right">
                          {t.grade != null ? t.grade : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
