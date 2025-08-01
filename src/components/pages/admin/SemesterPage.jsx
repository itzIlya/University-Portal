import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Stack, Chip, Paper, TextField, Switch, Button,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs        from "dayjs";
import useCrudList  from "../../../hooks/useCrudList";
import AdminCard    from "../../molecules/AdminCard";

/* blank template for a new record */
const emptySemester = {
  start_date : dayjs().format("YYYY-MM-DD"),
  end_date   : dayjs().add(4,"month").format("YYYY-MM-DD"),
  sem_title  : "",
  is_active  : false,
};

export default function SemesterPage() {
  /* one hook instance gives us create-helpers AND list data */
  const {
    items, loading, error, setError,
    newItem, setNewItem, create,
  } = useCrudList("semesters", emptySemester);

  /* --- create form handlers --- */
  const handleSubmit = e => {
    e.preventDefault();
    if (!newItem.sem_title || !newItem.start_date || !newItem.end_date) {
      setError("All fields are required");
      return;
    }
    create();
  };

  /* --- UI --- */
  return (
    <AdminCard>
      {/* create form */}
      <Typography variant="h6" mb={2}>Create Semester</Typography>

      {error && (
        <Alert sx={{ mb:2 }} severity="error" onClose={()=>setError(null)}>
          {error}
        </Alert>
      )}

      <Stack component="form" onSubmit={handleSubmit}
             direction={{ xs:"column", sm:"row" }} spacing={2} mb={4}>
        <TextField
          label="Title" required
          value={newItem.sem_title}
          onChange={e=>setNewItem({ ...newItem, sem_title:e.target.value })}
        />
        <TextField
          label="Start" type="date" required InputLabelProps={{ shrink:true }}
          value={newItem.start_date}
          onChange={e=>setNewItem({ ...newItem, start_date:e.target.value })}
        />
        <TextField
          label="End" type="date" required InputLabelProps={{ shrink:true }}
          value={newItem.end_date}
          onChange={e=>setNewItem({ ...newItem, end_date:e.target.value })}
        />
        <Stack direction="row" alignItems="center">
          <Typography mr={1}>Active?</Typography>
          <Switch
            checked={newItem.is_active}
            onChange={e=>setNewItem({ ...newItem, is_active:e.target.checked })}
          />
        </Stack>
        <Button variant="contained" type="submit">Add</Button>
      </Stack>

      {/* list header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CalendarMonthIcon color="primary"/>
          <Typography variant="h5" fontWeight={600}>Semesters</Typography>
        </Stack>
        <Chip color="primary" label={items.length}/>
      </Stack>

      {/* list table */}
      {loading ? (
        <Stack alignItems="center" my={4}><CircularProgress/></Stack>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">No semesters found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ "& tbody tr:nth-of-type(odd)":{ bgcolor:"action.hover" }}}>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell><TableCell>Start</TableCell>
                <TableCell>End</TableCell><TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(s=>(
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
