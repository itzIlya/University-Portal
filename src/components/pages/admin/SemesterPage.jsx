import React from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Paper,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs from "dayjs";
import useCrudList from "../../../hooks/useCrudList";
import AdminCard from "../../molecules/AdminCard";

const emptySemester = {
  sem_title: "",
  start_date: dayjs().format("YYYY-MM-DD"),
  end_date: dayjs().add(4, "month").format("YYYY-MM-DD"),
  is_active: true,
};

export default function SemesterPage() {
  const { items, loading, error, setError, newItem, setNewItem, create } =
    useCrudList("semesters", emptySemester);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.sem_title || !newItem.start_date || !newItem.end_date) {
      setError("All fields are required");
      return;
    }
    if (dayjs(newItem.start_date) >= dayjs(newItem.end_date)) {
      setError("Start date must be before end date");
      return;
    }
    console.log("Submitting semester:", newItem); // Debug payload
    create(newItem);
  };

  return (
    <AdminCard>
      {/* create form */}
      <Typography variant="h6" mb={2}>
        Create Semester
      </Typography>

      {error && (
        <Alert sx={{ mb: 2 }} severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack
        component="form"
        onSubmit={handleSubmit}
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        mb={4}
      >
        <TextField
          label="Title"
          required
          value={newItem.sem_title}
          onChange={(e) =>
            setNewItem({ ...newItem, sem_title: e.target.value })
          }
          helperText="Unique, max 30 chars (e.g., Summer-2026)"
          inputProps={{ maxLength: 30 }}
        />
        <TextField
          label="Start"
          type="date"
          required
          InputLabelProps={{ shrink: true }}
          value={newItem.start_date}
          onChange={(e) =>
            setNewItem({ ...newItem, start_date: e.target.value })
          }
        />
        <TextField
          label="End"
          type="date"
          required
          InputLabelProps={{ shrink: true }}
          value={newItem.end_date}
          onChange={(e) => setNewItem({ ...newItem, end_date: e.target.value })}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={newItem.is_active}
              onChange={(e) =>
                setNewItem({ ...newItem, is_active: e.target.checked })
              }
            />
          }
          label="Active"
        />
        <Button variant="contained" type="submit">
          Add
        </Button>
      </Stack>

      {/* list header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <CalendarMonthIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Semesters
          </Typography>
        </Stack>
        <Chip color="primary" label={items.length} />
      </Stack>

      {/* list table */}
      {loading ? (
        <Stack alignItems="center" my={4}>
          <CircularProgress />
        </Stack>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">No semesters found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table
            sx={{
              "& tbody tr:nth-of-type(odd)": { bgcolor: "action.hover" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.sid}>
                  <TableCell>{s.sem_title}</TableCell>
                  <TableCell>{s.start_date}</TableCell>
                  <TableCell>{s.end_date}</TableCell>
                  <TableCell>{s.is_active ? "🟢" : "⚪️"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </AdminCard>
  );
}