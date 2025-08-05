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

export default function MajorGPAView() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api
      .get("/major-gpa")
      .then(({ data }) => setData(data))
      .catch(() => setError("Failed to load Major GPA"))
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
        Average GPA by Major
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Major</TableCell>
              <TableCell align="right">Average GPA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.major_id}>
                <TableCell>{row.major_name}</TableCell>
                <TableCell align="right">
                  {row.avg_gpa != null ? row.avg_gpa.toFixed(2) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
