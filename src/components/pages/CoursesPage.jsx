/* -------------------------------- CoursePage.jsx -------------------------- */
import {
  Box, Grid, TextField, MenuItem, Button, Typography,
  Snackbar, Alert, Stack, Paper, Table, TableHead,
  TableRow, TableCell, TableBody, CircularProgress
} from "@mui/material";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";

import api         from "../../api/axios";
import useCrudList from "../../hooks/useCrudList";
import AdminCard   from "../molecules/AdminCard";

/* ---------- blank form template ---------- */
const empty = {
  course_code      : "",
  course_name      : "",
  prof_national_id : "",
  sem_title        : "",
  capacity         : "",
  max_capacity     : "",
  on_days          : "",
  on_times         : "",
  room_label       : "",
};

export default function CoursePage() {
  /* ───── dropdown data (4 parallel calls) ───────────────────────────── */
  const { items: semesters  , loading: semLoading } = useCrudList("semesters",       {});
  const { items: profRows   , loading: profLoading}= useCrudList("staff?role=PROF", {});
  const { items: members    , loading: mbrLoading } = useCrudList("members",        {});     // admin-only
  const { items: courses    , loading: crsLoading , refetch: refetchCourses } =
        useCrudList("courses", {});   // list of existing courses

  /* ───── join staff⇄members to get national_id for each professor ───── */
  const profOptions = useMemo(() => {
    if (!profRows.length || !members.length) return [];
    return profRows.map(p => {
      const mem = members.find(m =>
        m.fname === p.fname && m.lname === p.lname
      );
      return mem
        ? {
            national_id: mem.national_id,
            display:     `${p.fname} ${p.lname} – ${p.department_name}`,
          }
        : null;
    }).filter(Boolean);
  }, [profRows, members]);

  /* ───── local form + snack state ───────────────────────────────────── */
  const [form,  setForm ] = useState(empty);
  const [snack, setSnack] = useState({ open:false, msg:"", sev:"success" });

  const handle = field => e => setForm({ ...form, [field]: e.target.value });

  /* ───── POST create course ─────────────────────────────────────────── */
  const handleSubmit = async e => {
    e.preventDefault();

    /* quick client-side checks */
    if (!form.sem_title || !form.prof_national_id) {
      setSnack({ open:true, msg:"Semester & Professor must be selected", sev:"error" });
      return;
    }
    if (+form.capacity > +form.max_capacity) {
      setSnack({ open:true, msg:"Capacity cannot exceed Max Capacity", sev:"error" });
      return;
    }

    try {
      await api.post("presented-courses/create", {
        ...form,
        capacity:     Number(form.capacity),
        max_capacity: Number(form.max_capacity),
      });
      setSnack({ open:true, msg:"Course added ✔︎", sev:"success" });
      setForm(empty);
      refetchCourses();                        // refresh course table
    } catch (err) {
      console.error(err);
      setSnack({
        open:true,
        msg : err.response?.data?.detail ?? "Server error",
        sev : "error",
      });
    }
  };

  /* ───── render ─────────────────────────────────────────────────────── */
  const busy = semLoading || profLoading || mbrLoading;

  return (
    <Box sx={{ p:{ xs:2, md:4 } }}>
      <AdminCard>
        {/* ---------- title ---------- */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={3}>
          <LibraryBooksIcon color="primary"/>
          <Typography variant="h5" fontWeight={700}>Add&nbsp;Course</Typography>
        </Stack>

        {/* ---------- form ---------- */}
        <Paper component="form" onSubmit={handleSubmit} sx={{ p:3, borderRadius:2 }}>
          {busy ? (
            <Stack alignItems="center" my={4}><CircularProgress/></Stack>
          ) : (
            <Grid container spacing={2}>
              {/* ========== LEFT COLUMN ================================= */}
              <Grid item xs={12} md={6}>
                <TextField
                  select label="Semester" value={form.sem_title}
                  onChange={handle("sem_title")} fullWidth required sx={{ mb:2 }}>
                  {semesters.map(s => (
                    <MenuItem key={s.sid} value={s.sem_title}>{s.sem_title}</MenuItem>
                  ))}
                </TextField>

                <TextField label="Course Code" fullWidth required sx={{ mb:2 }}
                           value={form.course_code} onChange={handle("course_code")}/>

                <TextField label="Course Name" fullWidth required sx={{ mb:2 }}
                           value={form.course_name} onChange={handle("course_name")}/>

                {/* ⚑ Professor dropdown (value = national_id) */}
                <TextField
                  select label="Professor" required fullWidth sx={{ mb:2 }}
                  value={form.prof_national_id} onChange={handle("prof_national_id")}
                  helperText={profOptions.length===0 && "No professors found"}
                >
                  {profOptions.map(p => (
                    <MenuItem key={p.national_id} value={p.national_id}>
                      {p.display}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* ========== RIGHT COLUMN =============================== */}
              <Grid item xs={12} md={6}>
                <TextField label="Capacity"     type="number" fullWidth required sx={{ mb:2 }}
                           value={form.capacity} onChange={handle("capacity")}/>
                <TextField label="Max Capacity" type="number" fullWidth required sx={{ mb:2 }}
                           value={form.max_capacity} onChange={handle("max_capacity")}/>
                <TextField label="On Days (e.g. MW)"  fullWidth required sx={{ mb:2 }}
                           value={form.on_days}  onChange={handle("on_days")}/>
                <TextField label="On Times (e.g. 10-12)" fullWidth required sx={{ mb:2 }}
                           value={form.on_times} onChange={handle("on_times")}/>
                <TextField label="Room Label" fullWidth sx={{ mb:2 }}
                           value={form.room_label} onChange={handle("room_label")}/>
              </Grid>

              {/* ========== BUTTON ===================================== */}
              <Grid item xs={12}>
                <Button type="submit" variant="contained" fullWidth size="large">
                  Add Course
                </Button>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* ---------- existing courses table ---------- */}
        <Typography variant="h6" mt={4} mb={1}>Existing Courses</Typography>
        {crsLoading ? (
          <Stack alignItems="center" my={3}><CircularProgress/></Stack>
        ) : courses.length === 0 ? (
          <Typography color="text.secondary">No courses found.</Typography>
        ) : (
          <Box sx={{ maxHeight:360, overflow:"auto", borderRadius:1, boxShadow:1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Professor&nbsp;ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map(c => (
                  <TableRow key={c.cid}>
                    <TableCell>{c.course_code}</TableCell>
                    <TableCell>{c.course_name}</TableCell>
                    <TableCell>{c.prof_national_id ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </AdminCard>

      {/* ---------- snackbar ---------- */}
      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={()=>setSnack({...snack, open:false})}
        anchorOrigin={{ vertical:"bottom", horizontal:"center" }}
      >
        <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
