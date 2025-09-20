
import {
    Box, TextField, Button, Stack, Snackbar, Alert,
    Typography, Paper, Table, TableHead, TableRow,
    TableCell, TableBody, CircularProgress
  } from "@mui/material";
  import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
  
  import { useState } from "react";
  import api          from "../../../api/axios";
  import useCrudList  from "../../../hooks/useCrudList";
  import AdminCard    from "../../molecules/AdminCard";
  
  const empty = { course_code: "", course_name: "" };
  
  export default function CourseCreatePage() {
    const [refreshKey, setRefreshKey] = useState(0);
  
    /* list of existing courses */
    const {
      items: courses,
      loading,
      error,
    } = useCrudList(`courses?ts=${refreshKey}`, {});
  
    const [form,  setForm ] = useState(empty);
    const [snack, setSnack] = useState({ open:false, msg:"", sev:"success" });
  
    const handle = field => e => setForm({ ...form, [field]: e.target.value });
  
    const submit = async (e) => {
      e.preventDefault();
  
      if (!form.course_code || !form.course_name) {
        setSnack({ open:true, msg:"Both fields required", sev:"error" });
        return;
      }
  
      try {
        await api.post("courses", form);
        setSnack({ open:true, msg:"Course created ✔︎", sev:"success" });
        setForm(empty);
        setRefreshKey(k => k + 1);    
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
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <BookmarkAddIcon color="primary"/>
            <Typography variant="h5" fontWeight={700}>Create&nbsp;Course</Typography>
          </Stack>
  
          {/* form */}
          <Paper component="form" onSubmit={submit} sx={{ p:3, borderRadius:2 }}>
            <Stack direction={{ xs:"column", sm:"row" }} spacing={2}>
              <TextField
                label="Course Code"
                value={form.course_code}
                onChange={handle("course_code")}
                required
                fullWidth
              />
              <TextField
                label="Course Name"
                value={form.course_name}
                onChange={handle("course_name")}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" sx={{ whiteSpace:"nowrap" }}>
                Add
              </Button>
            </Stack>
          </Paper>
  
          {/* existing list */}
          <Typography variant="h6" mt={4} mb={1}>Existing Courses</Typography>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb:1 }}>
              {error}
            </Typography>
          )}
          {loading ? (
            <CircularProgress/>
          ) : courses.length === 0 ? (
            <Typography color="text.secondary">No courses defined yet.</Typography>
          ) : (
            <Box sx={{ maxHeight:360, overflow:"auto", borderRadius:1, boxShadow:1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map(c => (
                    <TableRow key={c.cid}>
                      <TableCell>{c.course_code}</TableCell>
                      <TableCell>{c.course_name}</TableCell>
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
          onClose={()=>setSnack({...snack, open:false})}
          anchorOrigin={{ vertical:"bottom", horizontal:"center" }}
        >
          <Alert severity={snack.sev} variant="filled">
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }
  