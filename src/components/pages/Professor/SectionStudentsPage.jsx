// src/components/pages/professor/SectionStudentsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Stack, Divider,
  TextField, Button, Snackbar,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import ProfessorNavbar from "../../organisms/Professor/ProfessorNavbar";

export default function SectionStudentsPage() {
  const { pcid } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [grades,   setGrades]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [snack,   setSnack]     = useState({ open: false, msg: "", sev: "success" });

  // fetch roster
  useEffect(() => {
    api.get(`/presented-courses/${pcid}/students`)
      .then(({ data }) => {
        setStudents(data);
        // init grade inputs
        const g = {};
        data.forEach((s) => { g[s.record_id] = s.grade ?? ""; });
        setGrades(g);
      })
      .catch(() => setError("Failed to load students"))
      .finally(() => setLoading(false));
  }, [pcid]);

  const handleChange = (rid) => (e) => {
    setGrades((g) => ({ ...g, [rid]: e.target.value }));
  };

  const saveGrade = (student) => {
    api.post("/grades", {
      record_id: student.record_id,
      pcid,
      grade: grades[student.record_id],
    })
      .then(() => {
        setSnack({ open: true, msg: "Grade saved", sev: "success" });
      })
      .catch((err) => {
        setSnack({ open: true, msg: err.response?.data?.detail || "Error", sev: "error" });
      });
  };

  const markTaking = (student) => {
    api.post("/taken-courses/status", {
      record_id: student.record_id,
      pcid,
      to_status: "TAKING",
    })
    .then(() => {
      // update local status
      setStudents(prev =>
        prev.map(s =>
          s.record_id === student.record_id ? { ...s, status: "TAKING" } : s
        )
      );
      setSnack({ open: true, msg: "Status updated to TAKING", sev: "success" });
    })
    .catch(err => {
      setSnack({
        open: true,
        msg: err.response?.data?.detail || "Unable to update status",
        sev: "error"
      });
    });
  };

  if (loading) return (
    <Stack alignItems="center" py={4}>
      <CircularProgress />
    </Stack>
  );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <ProfessorNavbar />

        <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Button onClick={() => navigate(-1)}>← Back</Button>
            <Typography variant="h5" fontWeight={700}>
              Section Roster
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3 }} />

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>First</TableCell>
                  <TableCell>Last</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Grade</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No students enrolled.
                    </TableCell>
                  </TableRow>
                )}
                {students.map((s) => (
                  <TableRow key={s.record_id}>
                    <TableCell>{s.student_number}</TableCell>
                    <TableCell>{s.fname}</TableCell>
                    <TableCell>{s.lname}</TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        value={grades[s.record_id]}
                        onChange={handleChange(s.record_id)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => saveGrade(s)}
                        >
                          Save
                        </Button>
                        {s.status === "RESERVED" && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => markTaking(s)}
                          >
                            Mark Taking
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.sev}
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
