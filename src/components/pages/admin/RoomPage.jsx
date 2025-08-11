
import {
    Box, Paper, Grid, TextField, Button, Snackbar, Alert,
    Stack, Typography, CircularProgress, Table, TableHead,
    TableRow, TableCell, TableBody
  } from "@mui/material";
  import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
  import { useState } from "react";
  
  import api         from "../../../api/axios";
  import useCrudList from "../../../hooks/useCrudList";
  import AdminCard   from "../../molecules/AdminCard";
  
  const empty = { room_label: "", capacity: "" };
  
  export default function RoomPage() {
    /* refreshKey whenever we want a fresh GET */
    const [refreshKey, setRefreshKey] = useState(0);
  
    /* list of rooms */
    const {
      items: rooms,
      loading: loadingRooms,
      error: roomsError,
    } = useCrudList(`rooms?ts=${refreshKey}`, {});   // ⬅ add cache-buster
  
    /* local form + feedback */
    const [form,  setForm ] = useState(empty);
    const [snack, setSnack] = useState({ open:false, msg:"", sev:"success" });
  
    const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  
    /* create room  */
    const submit = async (e) => {
      e.preventDefault();
  
      if (!form.room_label || !form.capacity) {
        setSnack({ open:true, msg:"Both fields required", sev:"error" });
        return;
      }
      if (+form.capacity <= 0) {
        setSnack({ open:true, msg:"Capacity must be > 0", sev:"error" });
        return;
      }
  
      try {
        await api.post("rooms", {
          room_label: form.room_label,
          capacity:   Number(form.capacity),
        });
        setSnack({ open:true, msg:"Room created ✔︎", sev:"success" });
        setForm(empty);
        setRefreshKey((k) => k + 1);          // trigger fresh GET
      } catch (err) {
        console.error(err);
        setSnack({
          open:true,
          msg : err.response?.data?.detail ?? "Server error",
          sev : "error",
        });
      }
    };
  
    return (
      <Box sx={{ p:{ xs:2, md:4 } }}>
        <AdminCard>
          {/* title */}
          <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
            <MeetingRoomIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Create&nbsp;Room</Typography>
          </Stack>
  
          {/* form */}
          <Paper component="form" onSubmit={submit}
                 sx={{ p:3, borderRadius:2, maxWidth:480, mx:"auto" }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Room Label"
                  fullWidth required
                  value={form.room_label}
                  onChange={handle("room_label")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Capacity"
                  type="number"
                  fullWidth required
                  value={form.capacity}
                  onChange={handle("capacity")}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" fullWidth>
                  Add Room
                </Button>
              </Grid>
            </Grid>
          </Paper>
  
          {/* table of rooms */}
          <Typography variant="h6" mt={4} mb={1}>Existing Rooms</Typography>
  
          {roomsError && (
            <Typography color="error" variant="body2" sx={{ mb:1 }}>
              {roomsError}
            </Typography>
          )}
  
          {loadingRooms ? (
            <Stack alignItems="center" my={3}><CircularProgress /></Stack>
          ) : rooms.length === 0 ? (
            <Typography color="text.secondary">No rooms found.</Typography>
          ) : (
            <Box sx={{ maxHeight:300, overflow:"auto", borderRadius:1, boxShadow:1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Capacity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map(r => (
                    <TableRow key={r.rid}>
                      <TableCell>{r.room_label}</TableCell>
                      <TableCell>{r.capacity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </AdminCard>
  
        {/* snackbar */}
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open:false })}
          anchorOrigin={{ vertical:"bottom", horizontal:"center" }}
        >
          <Alert severity={snack.sev} variant="filled">
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }
  