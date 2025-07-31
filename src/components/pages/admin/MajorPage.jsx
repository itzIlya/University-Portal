import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Stack, Chip, Paper, TextField, MenuItem, Button,
} from "@mui/material";
import SchoolIcon  from "@mui/icons-material/School";
import useCrudList from "../../../hooks/useCrudList";
import AdminCard from "../../molecules/AdminCard";

const emptyMajor = { major_name: "", department_name: "" };

export default function MajorPage({ isFormOnly = false }) {
  /* create panel */
  if (isFormOnly) {
    const { error, setError, newItem, setNewItem, create } =
      useCrudList("majors", emptyMajor);
    const { items: depts, loading: depLoad, error: depErr } =
      useCrudList("departments", {});

    const majorOk = newItem.major_name.trim().length > 0;
    const deptOk  = newItem.department_name.trim().length > 0;
    const formValid = majorOk && deptOk;

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formValid) {
        setError("Both fields are required");
        return;
      }
      create();
    };

    return (
      <>
        <Typography variant="h6" mb={2}>Create Major</Typography>
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
            label="Major"
            value={newItem.major_name}
            onChange={(e) => setNewItem({ ...newItem, major_name: e.target.value })}
            required
          />
          <TextField
            select
            label="Department"
            value={newItem.department_name}
            onChange={(e) => setNewItem({ ...newItem, department_name: e.target.value })}
            disabled={depLoad || !!depErr}
            required
            sx={{ minWidth: 180 }}
          >
            {depts.map((d) => (
              <MenuItem key={d.id} value={d.department_name}>
                {d.department_name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" type="submit" className="add-btn" disabled={!formValid}>
            Add
          </Button>
        </Stack>
      </>
    );
  }

  /* list view */
  const { items, loading, error, setError } = useCrudList("majors", {});

  return (
    <AdminCard>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SchoolIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>Majors</Typography>
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
        <Typography color="text.secondary">No majors found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ "& tbody tr:nth-of-type(odd)": { bgcolor: "action.hover" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Major</TableCell>
                <TableCell>Department</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((m, idx) => (
                <TableRow key={m.id ?? idx}>
                  <TableCell>{m.major_name}</TableCell>
                  <TableCell>{m.department_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </AdminCard>
  );
}
