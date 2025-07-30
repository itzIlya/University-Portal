import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from "@mui/material";
import useCrudList from "../../../hooks/useCrudList";

const emptyDept = { department_name: "", location: "" };

export default function DepartmentPage({ isFormOnly = false }) {
  const { items, loading, error, setError, newItem, setNewItem, create } =
    useCrudList("departments", emptyDept);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.department_name) {
      setError("Department name is required");
      return;
    }
    if (!newItem.location) {
      setError("Location is required");
      return;
    }
    create();
  };

  return (
    <Box sx={{ p: isFormOnly ? 0 : 4 }}>
      <Typography variant="h5" mb={2}>
        {isFormOnly ? "Create Department" : "Manage Departments"}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Grid
          container
          spacing={2}
          component="form"
          onSubmit={handleSubmit}
          sx={{ mb: isFormOnly ? 0 : 4 }}
        >
          <Grid item xs={12} sm={5}>
            <TextField
              label="Department Name"
              value={newItem.department_name}
              onChange={(e) =>
                setNewItem({ ...newItem, department_name: e.target.value })
              }
              fullWidth
              error={!newItem.department_name}
              helperText={!newItem.department_name ? "Required" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Location"
              value={newItem.location}
              onChange={(e) =>
                setNewItem({ ...newItem, location: e.target.value })
              }
              fullWidth
              error={!newItem.location}
              helperText={!newItem.location ? "Required" : ""}
            />
          </Grid>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          sx={{ display: "flex", justifyContent: "flex-end", ml: "auto" }}
        >
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-200 px-4"
            sx={{ height: 56 }}
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
            Existing Departments
          </Typography>
          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}
          {!loading && !error && items.length === 0 && (
            <Typography textAlign="center" color="text.secondary">
              No departments found.
            </Typography>
          )}
          {!loading && !error && items.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Department Name</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.department_name}</TableCell>
                      <TableCell>{d.location}</TableCell>
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