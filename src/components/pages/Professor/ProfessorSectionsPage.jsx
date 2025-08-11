
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
import ProfessorNavbar from "../../organisms/Professor/ProfessorNavbar";

export default function ProfessorSectionsPage() {
  const navigate = useNavigate();

  const [semesters, setSemesters]       = useState([]);
  const [sections, setSections]         = useState([]);
  const [selectedSid, setSelectedSid]   = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // 1) load all semesters + my sections
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/semesters"),
      api.get("/my-presented-courses"),
    ])
      .then(([semRes, secRes]) => {
        setSemesters(semRes.data);
        setSections(secRes.data);
        setSelectedSid(semRes.data[0]?.sid ?? "");
      })
      .catch(() => setError("Failed to load sections"))
      .finally(() => setLoading(false));
  }, []);

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

  // filter by selected semester
  const selTitle = semesters.find((s) => s.sid === selectedSid)?.sem_title;
  const filtered = sections.filter((sec) => sec.sem_title === selTitle);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <ProfessorNavbar />

      <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 }}>
        {/* Page Header */}
        <Typography variant="h5" fontWeight={700} mb={2}>
          My Sections
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Semester Selector */}
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Semester</InputLabel>
          <Select
            value={selectedSid}
            label="Semester"
            onChange={(e) => setSelectedSid(e.target.value)}
          >
            {semesters.map((s) => (
              <MenuItem key={s.sid} value={s.sid}>
                {s.sem_title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sections Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Course Code</TableCell>
                <TableCell>Course Name</TableCell>
                <TableCell>Days / Times</TableCell>
                <TableCell>Room</TableCell>
                <TableCell align="right">Students</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((sec) => (
                  <TableRow key={sec.pcid}>
                    <TableCell>{sec.course_code}</TableCell>
                    <TableCell>{sec.course_name}</TableCell>
                    <TableCell>
                      {sec.on_days} @ {sec.on_times}
                    </TableCell>
                    <TableCell>{sec.room}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          navigate(`/professor/sections/${sec.pcid}/students`)
                        }
                      >
                        Show Students
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No sections this semester.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
