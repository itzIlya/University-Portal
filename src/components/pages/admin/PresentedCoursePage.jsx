import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Snackbar,
  Alert,
  Stack,
  Paper,
  CircularProgress,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";

import api from "../../../api/axios";
import useCrudList from "../../../hooks/useCrudList";
import AdminCard from "../../molecules/AdminCard";

const emptyForm = {
  prof_national_id: "",
  course_name: "",
  sem_title: "",
  capacity: "",
  max_capacity: "",
  on_days: "",
  on_times: "",
  room_label: ""
};

export default function PresentedCoursePage() {

  const { items: courses } = useCrudList("courses", {});
  const { items: semesters } = useCrudList("semesters", {});
  const { items: majors } = useCrudList("majors", {});
  const { items: rooms } = useCrudList("rooms", {});
  const { items: profRows } = useCrudList("staff?role=PROF", {});
  const { items: members } = useCrudList("members", {});

  const profOptions = useMemo(() => {
    if (!profRows.length || !members.length) return [];
    return profRows.flatMap(p => {
      const m = members.find(
        x => x.fname === p.fname && x.lname === p.lname
      );
      return m
        ? [
            {
              id: m.national_id,
              label: `${p.fname} ${p.lname} — ${p.department_name}`
            }
          ]
        : [];
    });
  }, [profRows, members]);

  const [form, setForm] = useState(emptyForm);
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    sev: "success"
  });

  const handle = key => e =>
    setForm({
      ...form,
      [key]: e.target.value
    });

  const [refreshKey, setRefreshKey] = useState(0);

  const [filterSem, setFilterSem] = useState("");
  const [filterMajor, setFilterMajor] = useState("");

  useEffect(() => {
    if (!filterSem && semesters.length) {
      setFilterSem(semesters[0].sid);
    }
  }, [semesters, filterSem]);

  useEffect(() => {
    if (!filterMajor && majors.length) {
      setFilterMajor(majors[0].major_id);
    }
  }, [majors, filterMajor]);

  /* presented-courses list state */
  const [pcRows, setPcRows] = useState([]);
  const [pcLoad, setPcLoad] = useState(false);
  const [pcError, setPcError] = useState(null);

  /* fetch table any time filters or refreshKey change */
  useEffect(() => {
    if (!filterSem || !filterMajor) return;
    (async () => {
      setPcLoad(true);
      setPcError(null);
      try {
        const { data } = await api.get("/presented-courses", {
          params: {
            semester_id: filterSem,
            major_id: filterMajor
          }
        });
        setPcRows(data);
      } catch (err) {
        console.error(err);
        setPcError(
          err.response?.data?.detail ?? "Failed to load presented courses"
        );
      } finally {
        setPcLoad(false);
      }
    })();
  }, [filterSem, filterMajor, refreshKey]);

  /* create presented course  */
  const submit = async e => {
    e.preventDefault();
    if (!form.course_name || !form.prof_national_id || !form.sem_title) {
      setSnack({
        open: true,
        msg: "Course, Professor, Semester required",
        sev: "error"
      });
      return;
    }
    if (+form.capacity > +form.max_capacity) {
      setSnack({
        open: true,
        msg: "Capacity cannot exceed Max Capacity",
        sev: "error"
      });
      return;
    }

    try {
      await api.post("presented-courses/create", {
        ...form,
        capacity: Number(form.capacity),
        max_capacity: Number(form.max_capacity)
      });
      setSnack({
        open: true,
        msg: "Presented course created ✔︎",
        sev: "success"
      });
      setForm(emptyForm);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        msg: err.response?.data?.detail ?? "Server error",
        sev: "error"
      });
    }
  };

  const busy =
    !courses.length ||
    !semesters.length ||
    !majors.length ||
    !rooms.length ||
    !profOptions.length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <AdminCard>
        {/* title */}
        <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
          <SchoolIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Create Presented Course
          </Typography>
        </Stack>

        {/* form */}
        <Paper component="form" onSubmit={submit} sx={{ p: 3, borderRadius: 2 }}>
          {busy ? (
            <Stack alignItems="center" my={4}>
              <CircularProgress />
            </Stack>
          ) : (
            <Grid container spacing={2}>
              {/* left */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Course"
                  sx={{ mb: 2 }}
                  value={form.course_name}
                  onChange={handle("course_name")}
                >
                  {courses.map(c => (
                    <MenuItem key={c.cid} value={c.course_name}>
                      {c.course_code} — {c.course_name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  required
                  label="Professor"
                  sx={{ mb: 2 }}
                  value={form.prof_national_id}
                  onChange={handle("prof_national_id")}
                >
                  {profOptions.map(p => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  required
                  label="Semester"
                  sx={{ mb: 2 }}
                  value={form.sem_title}
                  onChange={handle("sem_title")}
                >
                  {semesters.map(s => (
                    <MenuItem key={s.sid} value={s.sem_title}>
                      {s.sem_title}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Capacity"
                  type="number"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  value={form.capacity}
                  onChange={handle("capacity")}
                />
                <TextField
                  label="Max Capacity"
                  type="number"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  value={form.max_capacity}
                  onChange={handle("max_capacity")}
                />
                <TextField
                  label="On Days (e.g. MW)"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  value={form.on_days}
                  onChange={handle("on_days")}
                />
                <TextField
                  label="On Times (e.g. 10-12)"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  value={form.on_times}
                  onChange={handle("on_times")}
                />

                <TextField
                  select
                  fullWidth
                  required
                  label="Room"
                  sx={{ mb: 2 }}
                  value={form.room_label}
                  onChange={handle("room_label")}
                >
                  {rooms.map(r => (
                    <MenuItem key={r.rid} value={r.room_label}>
                      {r.room_label} — {r.capacity}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* submit button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                >
                  Add Presented Course
                </Button>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* filter controls + table */}
        <Divider sx={{ my: 4 }} />
        <Typography variant="h6" gutterBottom>
          Presented Courses
        </Typography>

        {/* filters */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            select
            label="Semester"
            size="small"
            sx={{ minWidth: 180 }}
            value={filterSem}
            onChange={e => setFilterSem(e.target.value)}
          >
            {semesters.map(s => (
              <MenuItem key={s.sid} value={s.sid}>
                {s.sem_title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Major"
            size="small"
            sx={{ minWidth: 220 }}
            value={filterMajor}
            onChange={e => setFilterMajor(e.target.value)}
          >
            {majors.map(m => (
              <MenuItem key={m.major_id} value={m.major_id}>
                {m.major_name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {pcLoad ? (
          <Stack alignItems="center" my={3}>
            <CircularProgress />
          </Stack>
        ) : pcError ? (
          <Typography color="error" variant="body2">
            {pcError}
          </Typography>
        ) : pcRows.length === 0 ? (
          <Typography color="text.secondary">
            No presented courses for this filter.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 320,
              overflow: "auto",
              borderRadius: 1,
              boxShadow: 1
            }}
          >
            <Table
              size="small"
              sx={{
                "& tbody tr:nth-of-type(odd)": { bgcolor: "action.hover" }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Course</TableCell>
                  <TableCell>Professor</TableCell>
                  <TableCell>On Days</TableCell>
                  <TableCell>On Times</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell align="right">Cap / Max</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pcRows.map(r => (
                  <TableRow key={r.pcid}>
                    <TableCell>
                      {r.course_code} — {r.course_name}
                    </TableCell>
                    <TableCell>{r.professor}</TableCell>
                    <TableCell>{r.on_days}</TableCell>
                    <TableCell>{r.on_times}</TableCell>
                    <TableCell>{r.room}</TableCell>
                    <TableCell align="right">
                      {r.capacity} / {r.max_capacity}
                    </TableCell>
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
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.sev} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}