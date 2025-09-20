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

export default function ProfessorLoadView() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api
      .get("/professor-course-load")
      .then(({ data }) => setData(data))
      .catch(() => setError("Failed to load professor course-loads"))
      .finally(() => setLoading(false));
  }, []);

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
        Professor Course Loads
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Professor</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right"># Sections</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.prof_mid}>
                <TableCell>
                  {row.fname} {row.lname}
                </TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell align="right">{row.course_load}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
