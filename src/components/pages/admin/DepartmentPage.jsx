import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Stack, Chip, Paper, TextField, Button,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import useCrudList   from "../../../hooks/useCrudList";
import AdminCard     from "../../atoms/AdminCard";

const emptyDept = { department_name: "", location: "" };

export default function DepartmentPage({ isFormOnly = false }) {
  /* create panel */
  if (isFormOnly) {
    const { error, setError, newItem, setNewItem, create } =
      useCrudList("departments", emptyDept);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!newItem.department_name || !newItem.location) {
        setError("All fields are required");
        return;
      }
      create();
    };

    return (
      <>
        <Typography variant="h6" mb={2}>Create Department</Typography>
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
        >
          <TextField
            label="Department"
            value={newItem.department_name}
            onChange={(e) => setNewItem({ ...newItem, department_name: e.target.value })}
            required
          />
          <TextField
            label="Location"
            value={newItem.location}
            onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
            required
          />
          <Button variant="contained" type="submit" className="add-btn">Add</Button>
        </Stack>
      </>
    );
  }

  /* list view */
  const { items, loading, error, setError } = useCrudList("departments", {});

  return (
    <AdminCard>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BusinessIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>Departments</Typography>
        </Stack>
        <Chip color="primary" label={items.length} />
      </Stack>

      {error && (
        <Alert sx={{ mb: 2 }} severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack alignItems="center" my={4}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">No departments found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ "& tbody tr:nth-of-type(odd)": { bgcolor: "action.hover" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((d, idx) => (
                <TableRow key={d.id ?? idx}>
                  <TableCell>{d.department_name}</TableCell>
                  <TableCell>{d.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </AdminCard>
  );
}
