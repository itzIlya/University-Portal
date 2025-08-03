// src/components/pages/student/StudentSemestersPage.jsx
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import StudentNavbar from "../../organisms/student/StudentNavbar";

export default function StudentSemestersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recordId, setRecordId] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) fetch record_id
  useEffect(() => {
    api
      .get("/my-student-records")
      .then(({ data }) => {
        if (data.length) setRecordId(data[0].record_id);
        else setError("No student record found");
      })
      .catch(() => setError("Failed to fetch student record"));
  }, []);

  // 2) once we have record_id, load semesters + enrolled semesters
  useEffect(() => {
    if (!recordId) return;
    setLoading(true);
    Promise.all([
      api.get("/semesters"),
      api.get("/student-semesters", { params: { record_id: recordId } }),
    ])
      .then(([semRes, enrolledRes]) => {
        setSemesters(semRes.data);
        setEnrolled(enrolledRes.data); // [{ semester_id, sem_status, sem_gpa }, ...]
      })
      .catch(() => setError("Failed to load semesters"))
      .finally(() => setLoading(false));
  }, [recordId]);

  const isEnrolled = (sid) =>
    enrolled.some((e) => e.semester_id === sid);

  const handleEnroll = (sid) => {
    api
      .post("/student-semesters", { record_id: recordId })
      .then(() =>
        setEnrolled((prev) => [
          ...prev,
          { semester_id: sid, sem_status: "ENROLLED", sem_gpa: null },
        ])
      )
      .catch(() => setError("Enrollment failed"));
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

  // split active vs others
  const active = semesters.filter((s) => s.is_active);
  const others = semesters.filter((s) => !s.is_active);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <StudentNavbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>

        {/* — Active Semester — */}
        <Typography variant="h5" mb={2}>
          Active Semester
        </Typography>
        {active.length === 0 ? (
          <Typography>No active semester right now.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {active.map((s) => (
                  <TableRow key={s.sid}>
                    <TableCell>{s.sem_title}</TableCell>
                    <TableCell>
                      {s.start_date} – {s.end_date}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isEnrolled(s.sid)}
                        onClick={() => handleEnroll(s.sid)}
                      >
                        {isEnrolled(s.sid) ? "Enrolled" : "Enroll"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* — All Semesters — */}
        <Typography variant="h5" mb={2}>
          All Semesters
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell align="right">Status</TableCell>
                <TableCell align="right">Courses</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {semesters.map((s) => {
                const rec = enrolled.find((e) => e.semester_id === s.sid);
                return (
                  <TableRow key={s.sid}>
                    <TableCell>{s.sem_title}</TableCell>
                    <TableCell>
                      {s.start_date} – {s.end_date}
                    </TableCell>
                    <TableCell align="right">
                      {rec ? rec.sem_status : s.is_active ? "Active" : "Available"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/student/semesters/${s.sid}`)}
                      >
                        View Courses
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* — Enrolled Semesters — */}
        <Typography variant="h5" mb={2}>
          Enrolled Semesters
        </Typography>
        {enrolled.length === 0 ? (
          <Typography>You haven’t enrolled in any semesters yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">GPA</TableCell>
                  <TableCell align="right">Courses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrolled.map((e) => {
                  const sem = semesters.find((s) => s.sid === e.semester_id);
                  return (
                    <TableRow key={e.semester_id}>
                      <TableCell>{sem?.sem_title}</TableCell>
                      <TableCell>
                        {sem?.start_date} – {sem?.end_date}
                      </TableCell>
                      <TableCell align="right">{e.sem_status}</TableCell>
                      <TableCell align="right">
                        {e.sem_gpa != null ? e.sem_gpa : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            navigate(`/student/semesters/${e.semester_id}`)
                          }
                        >
                          View Courses
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
