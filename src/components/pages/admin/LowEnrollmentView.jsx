import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import api from "../../../api/axios";

export default function LowEnrollmentCoursesView({ threshold = 10 }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api
      .get(`/low-enrolment-courses?threshold=${threshold}`)
      .then(({ data }) => setData(data))
      .catch(() => setError("Failed to load low-enrollment courses"))
      .finally(() => setLoading(false));
  }, [threshold]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", my: 4, px: 2 }}>
      <Typography variant="h5" mb={2}>
        Sections with Enrollment &lt; {threshold}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Code</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell align="right">Max Cap.</TableCell>
              <TableCell align="right">Enrolled</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.pcid}>
                <TableCell>{row.course_code}</TableCell>
                <TableCell>{row.course_name}</TableCell>
                <TableCell>{row.semester}</TableCell>
                <TableCell align="right">{row.max_capacity}</TableCell>
                <TableCell align="right">{row.enrolled_cnt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
