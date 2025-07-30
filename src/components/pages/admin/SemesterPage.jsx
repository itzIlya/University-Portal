import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from "@mui/material";
import dayjs from "dayjs";
import useCrudList from "../../../hooks/useCrudList";

const emptySemester = {
  start_date: dayjs().format("YYYY-MM-DD"),
  end_date: dayjs().add(4, "month").format("YYYY-MM-DD"),
  sem_title: "",
  is_active: false,
};

export default function SemesterPage({ isFormOnly = false }) {
  const { items, loading, error, setError, newItem, setNewItem, create } =
    useCrudList("semesters", emptySemester);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.sem_title) {
      setError("Semester title is required");
      return;
    }
    if (!newItem.start_date || !newItem.end_date) {
      setError("Start and end dates are required");
      return;
    }
    create();
  };

  return (
    <Box sx={{ p: isFormOnly ? 0 : 4 }}>
      <Typography variant="h5" mb={2}>
        {isFormOnly ? "Create Semester" : "Manage Semesters"}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Grid
          container
          spacing={2}
          component="form"
          onSubmit={handleSubmit}
          sx={{ mb: isFormOnly ? 0 : 4 }}
        >
          <Grid item xs={12} sm={3}>
            <TextField
              label="Title"
              value={newItem.sem_title}
              onChange={(e) =>
                setNewItem({ ...newItem, sem_title: e.target.value })
              }
              fullWidth
              error={!newItem.sem_title}
              helperText={!newItem.sem_title ? "Required" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Start Date"
              type="date"
              value={newItem.start_date}
              onChange={(e) =>
                setNewItem({ ...newItem, start_date: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!newItem.start_date}
              helperText={!newItem.start_date ? "Required" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="End Date"
              type="date"
              value={newItem.end_date}
              onChange={(e) =>
                setNewItem({ ...newItem, end_date: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!newItem.end_date}
              helperText={!newItem.end_date ? "Required" : ""}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={2}
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Typography mr={1}>Active?</Typography>
            <Switch
              checked={newItem.is_active}
              onChange={(e) =>
                setNewItem({ ...newItem, is_active: e.target.checked })
              }
            />
          </Grid>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          sx={{ display: "flex", justifyContent: "flex-start", ml: "auto" }}
        >
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-200 px-4"
            sx={{ height: 50 }}
          >
            Add
          </Button>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!isFormOnly && (
        <>
          <Typography variant="h6" mt={2} mb={1}>
            Existing Semesters
          </Typography>
          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}
          {!loading && !error && items.length === 0 && (
            <Typography textAlign="center" color="text.secondary">
              No semesters found.
            </Typography>
          )}
          {!loading && !error && items.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((s) => (
                    <TableRow key={s.id}>
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
        </>
      )}
    </Box>
  );
}