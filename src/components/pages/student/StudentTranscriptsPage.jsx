// src/components/pages/student/StudentTranscriptsPage.jsx

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
  CircularProgress,
  Alert,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import StudentNavbar from "../../organisms/student/StudentNavbar";

export default function StudentTranscriptsPage() {
  const navigate = useNavigate();

  const [recordId, setRecordId]       = useState(null);
  const [enrolled, setEnrolled]       = useState([]);   // [{ semester_id, sem_status, sem_gpa }, …]
  const [semesters, setSemesters]     = useState([]);   // all semesters metadata
  const [selectedSid, setSelectedSid] = useState("");
  const [courses, setCourses]         = useState([]);
  const [overallGpa, setOverallGpa]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // 1) get record_id
  useEffect(() => {
    api.get("/my-student-records")
      .then(({ data }) => {
        if (!data.length) throw new Error("No student record");
        setRecordId(data[0].record_id);
      })
      .catch((e) => setError(e.message));
  }, []);

  // 1b) once record_id → fetch overall GPA from dedicated GPA endpoint
  useEffect(() => {
    if (!recordId) return;
    api.get("/student-record-gpa", { params: { record_id: recordId } })
      .then(({ data }) => {
        // expected response: { gpa: <number> }
        setOverallGpa(data.gpa);
      })
      .catch(() => {
        // ignore errors; overallGpa remains null
      });
  }, [recordId]);

  // 2) once record_id → load enrolled semesters + all semester titles
  useEffect(() => {
    if (!recordId) return;
    setLoading(true);
    Promise.all([
      api.get("/student-semesters", { params: { record_id: recordId } }),
      api.get("/semesters"),
    ])
      .then(([eRes, sRes]) => {
        setEnrolled(eRes.data);
        setSemesters(sRes.data);
        const first = eRes.data[0]?.semester_id;
        setSelectedSid(first || "");
      })
      .catch(() => setError("Failed to load semesters"))
      .finally(() => setLoading(false));
  }, [recordId]);

  // 3) whenever selectedSid changes → fetch that semester’s taken courses
  useEffect(() => {
    if (!selectedSid) return;
    setLoading(true);
    api
      .get("/my-taken-courses", { params: { semester_id: selectedSid } })
      .then(({ data }) => setCourses(data))
      .catch(() => setError("Failed to load transcript"))
      .finally(() => setLoading(false));
  }, [selectedSid]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // find sem_gpa for selected
  const selectedSem = enrolled.find(e => e.semester_id === selectedSid);
  const semGpa      = selectedSem?.sem_gpa ?? null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <StudentNavbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>
        {/* header + back */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button onClick={() => navigate(-1)}>← Back</Button>
          <Typography variant="h5" fontWeight={700}>
            My Transcripts
          </Typography>
        </Stack>
        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            {/* semester dropdown */}
            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>Semester</InputLabel>
              <Select
                value={selectedSid}
                label="Semester"
                onChange={(e) => setSelectedSid(e.target.value)}
              >
                {enrolled.map((row) => {
                  const title = semesters.find(
                    (s) => s.sid === row.semester_id
                  )?.sem_title;
                  return (
                    <MenuItem key={row.semester_id} value={row.semester_id}>
                      {title}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* GPA summary boxes */}
            <Stack direction="row" spacing={4} mb={4}>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Semester GPA
                </Typography>
                <Typography variant="h6">
                  {semGpa != null ? semGpa.toFixed(2) : "—"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Overall GPA
                </Typography>
                <Typography variant="h6">
                  {overallGpa != null ? overallGpa.toFixed(2) : "—"}
                </Typography>
              </Paper>
            </Stack>

            {/* courses & grades table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Professor</TableCell>
                    <TableCell>Days/Times</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Grade</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No courses taken this semester.
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((t) => (
                      <TableRow key={t.pcid}>
                        <TableCell>{t.course_code}</TableCell>
                        <TableCell>{t.course_name}</TableCell>
                        <TableCell>{t.professor}</TableCell>
                        <TableCell>
                          {t.on_days} @ {t.on_times}
                        </TableCell>
                        <TableCell>{t.room}</TableCell>
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
          </>
        )}
      </Box>
    </Box>
  );
}
