import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Stack, Chip, Paper, TextField, MenuItem, Button,
} from "@mui/material";
import SchoolIcon    from "@mui/icons-material/School";
import useCrudList   from "../../../hooks/useCrudList";
import AdminCard     from "../../molecules/AdminCard";

const emptyMajor = { major_name:"", department_name:"" };

export default function MajorPage() {
  /* create hook */
  const {
    newItem, setNewItem, create,
    error, setError,
  } = useCrudList("majors", emptyMajor);

  /* list hook */
  const {
    items, loading,
  } = useCrudList("majors", {});

  /* departments for the select */
  const { items: depts, loading: depLoad } = useCrudList("departments", {});

  const formValid = newItem.major_name.trim() && newItem.department_name.trim();

  const handleSubmit = e => {
    e.preventDefault();
    if (!formValid) { setError("Both fields are required"); return; }
    create();
  };

  return (
    <AdminCard>
      {/* create form */}
      <Typography variant="h6" mb={2}>Create Major</Typography>

      {error && (
        <Alert sx={{ mb:2 }} severity="error" onClose={()=>setError(null)}>
          {error}
        </Alert>
      )}

      <Stack component="form" onSubmit={handleSubmit}
             direction={{ xs:"column", sm:"row" }} spacing={2} mb={4}>
        <TextField
          label="Major" required
          value={newItem.major_name}
          onChange={e=>setNewItem({ ...newItem, major_name:e.target.value })}
        />
        <TextField
          select required sx={{ minWidth:180 }}
          label="Department" disabled={depLoad}
          value={newItem.department_name}
          onChange={e=>setNewItem({ ...newItem, department_name:e.target.value })}
        >
          {depts.map(d=>(
            <MenuItem key={d.did} value={d.department_name}>
              {d.department_name}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" type="submit" disabled={!formValid}>Add</Button>
      </Stack>

      {/* list */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SchoolIcon color="primary"/>
          <Typography variant="h5" fontWeight={600}>Majors</Typography>
        </Stack>
        <Chip color="primary" label={items.length}/>
      </Stack>

      {loading ? (
        <Stack alignItems="center" my={4}><CircularProgress/></Stack>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">No majors found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ "& tbody tr:nth-of-type(odd)":{ bgcolor:"action.hover" }}}>
            <TableHead>
              <TableRow><TableCell>Major</TableCell><TableCell>Department</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {items.map(m=>(
                <TableRow key={m.mid}>
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
