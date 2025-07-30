import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
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

const emptyMajor = { major_name: "", department_name: "" };

export default function MajorPage({ isFormOnly = false }) {
  /* ------- majors: GET + POST ------- */
  const {
    items,
    loading,
    error,
    setError,
    newItem,
    setNewItem,
    create,
  } = useCrudList("majors", emptyMajor);

  /* ------- departments for dropdown ------- */
  const {
    items: departments,
    loading: deptsLoading,
    error: deptsError,
  } = useCrudList("departments", {}); // read-only; we won’t call create()

  /* ------- local validation ------- */
  const majorOk = newItem.major_name.trim().length > 0;
  const deptOk  = newItem.department_name.trim().length > 0;
  const formValid = majorOk && deptOk;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formValid) {
      setError("Both Major and Department are required.");
      return;
    }
    /* send trimmed payload */
    setNewItem({
      major_name:      newItem.major_name.trim(),
      department_name: newItem.department_name.trim(),
    });
    create();
  };

  return (
    <Box sx={{ p: isFormOnly ? 0 : 4 }}>
      <Typography variant="h5" mb={2}>
        {isFormOnly ? "Create Major" : "Manage Majors"}
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
              label="Major Name"
              value={newItem.major_name}
              onChange={(e) =>
                setNewItem({ ...newItem, major_name: e.target.value })
              }
              fullWidth
              error={!majorOk}
              helperText={!majorOk ? "Required" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              select
              label="Department"
              value={newItem.department_name}
              onChange={(e) =>
                setNewItem({ ...newItem, department_name: e.target.value })
              }
              fullWidth
              disabled={deptsLoading || !!deptsError}
              error={!deptOk}
              helperText={
                deptsLoading
                  ? "Loading departments…"
                  : deptsError
                  ? "Failed to load departments"
                  : !deptOk
                  ? "Required"
                  : ""
              }
            >
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.department_name}>
                  {d.department_name}
                </MenuItem>
              ))}
            </TextField>
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
            disabled={!formValid}
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
            Existing Majors
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography textAlign="center" color="text.secondary">
              No majors found.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Major Name</TableCell>
                    <TableCell>Department Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.major_name}</TableCell>
                      <TableCell>{m.department_name}</TableCell>
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