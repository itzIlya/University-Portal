import {
    Box,
    Stack,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
  } from '@mui/material';
  import { DataGrid } from '@mui/x-data-grid';
  import { useState, useEffect } from 'react';
  import TopNavbar from '../organisms/TopNavbar';
  import axios from '../../api/axios';
  
  /* ──────────────────── TABLE COLUMNS ──────────────────── */
  const columns = [
    { field: 'code', headerName: 'Course Code', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'instructor', headerName: 'Instructor', width: 180 },
    { field: 'capacity', headerName: 'Cap', width: 90 },
    {
      field: 'seatsRemaining',
      headerName: 'Seats',
      width: 90,
      valueGetter: ({ row }) => (row ? row.seatsRemaining : ''),   // ← safe
    },
    {
      field: 'action',
      headerName: ' ',
      width: 130,
      sortable: false,
      renderCell: ({ row }) => <EnrollButton row={row} />,
    },
  ];
  
  /* ──────────────────── BUTTON WITH DISABLE LOGIC ──────────────────── */
  function EnrollButton({ row }) {
    const disabled = row.seatsRemaining === 0;      // seats only; prereq handled via dialog
    return (
      <Button
        size="small"
        variant="contained"
        disabled={disabled}
        onClick={() => window.dispatchEvent(new CustomEvent('enroll-click', { detail: row }))}
      >
        Enroll
      </Button>
    );
  }
  
  /* ──────────────────── PAGE ──────────────────── */
  export default function CoursesPage() {
    const [semester, setSemester] = useState('Fall 2025');
    const [rows, setRows] = useState([]);
  
    /* feedback */
    const [snack, setSnack]   = useState({ open: false, message: '', severity: 'info' });
    const [prereqDlg, setDlg] = useState({ open: false, course: null });
  
    /* fetch rows */
    useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          const { data } = await axios.get(
            `/mock/courses/?semester=${encodeURIComponent(semester)}`
          );
          if (!ignore) setRows(data);
        } catch (err) {
          console.error(err);
        }
      })();
      return () => { ignore = true; };
    }, [semester]);
  
    /* handle enroll clicks (CustomEvent) */
    useEffect(() => {
      const handler = (e) => {
        const c = e.detail;
  
        /* ── full ───────────────────────────── */
        if (c.seatsRemaining === 0) {
          console.log(`❌ No seats left for ${c.code}`);
          setSnack({ open: true, message: 'Course is full', severity: 'error' });
          return;
        }
  
        /* ── prereq not met – show dialog ───── */
        if (!c.prereqMet) {
          console.log(`❌ Prerequisites not met for ${c.code}`);
          setDlg({ open: true, course: c });
          return;
        }
  
        /* ── success (mock) ─────────────────── */
        console.log(`✅ Enrolling student in ${c.code}`, c);
        setSnack({ open: true, message: 'Enrolled successfully (mock)', severity: 'success' });
        /* TODO: axios.post('/students/{id}/enrollments', { section_id: … }) */
      };
  
      window.addEventListener('enroll-click', handler);
      return () => window.removeEventListener('enroll-click', handler);
    }, []);
  
    return (
      <>
        <TopNavbar />
  
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack spacing={3} maxWidth="1000px" mx="auto">
            <Typography variant="h4" fontWeight={700} textAlign="center">
              Available Courses
            </Typography>
  
            {/* semester picker */}
            <FormControl size="small" sx={{ maxWidth: 200 }}>
              <InputLabel id="sem-label">Semester</InputLabel>
              <Select
                labelId="sem-label"
                value={semester}
                label="Semester"
                onChange={(e) => setSemester(e.target.value)}
              >
                <MenuItem value="Fall 2025">Fall 2025</MenuItem>
                <MenuItem value="Spring 2026">Spring 2026</MenuItem>
                <MenuItem value="Summer 2026">Summer 2026</MenuItem>
              </Select>
            </FormControl>
  
            {/* table */}
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSizeOptions={[5, 10, 20]}
                getRowId={(r) => r.id}
                density="comfortable"
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.100' },
                }}
              />
            </Box>
          </Stack>
        </Box>
  
        {/* ───────────────── snack ───────────────── */}
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snack.severity} variant="filled">
            {snack.message}
          </Alert>
        </Snackbar>
  
        {/* ───────────────── prereq dialog ──────────────── */}
        <Dialog
          open={prereqDlg.open}
          onClose={() => setDlg({ open: false, course: null })}
        >
          <DialogTitle>Cannot Enroll</DialogTitle>
          <DialogContent>
            <Typography>
              You must pass the prerequisites before enrolling in&nbsp;
              <strong>{prereqDlg.course?.code}</strong>.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDlg({ open: false, course: null })}>OK</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
  