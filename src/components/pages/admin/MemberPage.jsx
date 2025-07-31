import React, { useState } from "react";                 // ← NEW
import {
  Box, Stack, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip,
} from "@mui/material";
import PeopleIcon           from "@mui/icons-material/People";
import ArrowForwardIosIcon  from "@mui/icons-material/ArrowForwardIos";
import dayjs                from "dayjs";
import useCrudList          from "../../../hooks/useCrudList";
import api                  from "../../../api/axios";
import AdminCard            from "../../molecules/AdminCard";

  
  const STAFF_ROLES   = ["INSTRUCTOR", "CLERK", "CHAIR", "ADMIN", "PROF"];
  const ALL_ROLES     = ["STUDENT", ...STAFF_ROLES];
  
  export default function MemberPage() {
    /* ------------ main data ---------------- */
    const { items, loading, error, setError, refetch } = useCrudList("members", {});
  
    /* ------------ dropdown / dialog state -- */
    const [open, setOpen]             = useState(false);
    const [dialogRole, setDialogRole] = useState("");   // STUDENT or staff role
    const [member, setMember]         = useState(null); // clicked member object
  
    /* fetched once for dropdowns */
    const { items: majors }       = useCrudList("majors",       {});
    const { items: departments }  = useCrudList("departments",  {});
  
    /* form fields */
    const [majorName,      setMajorName] = useState("");
    const [departmentName, setDeptName]  = useState("");
  
    /* open dialog */
    const handleSelect = (m, role) => {
      setMember(m);
      setDialogRole(role);
      setMajorName("");
      setDeptName("");
      setOpen(true);
    };
  
    /* POST according to chosen role */
    const handleSubmit = async () => {
      try {
        if (dialogRole === "STUDENT") {
          await api.post("student-records", {
            national_id: member.national_id,
            major_name:  majorName,
          });
        } else {
          await api.post("staff-roles", {
            national_id:     member.national_id,
            department_name: departmentName,
            staff_role:      dialogRole,
            start_date:      dayjs().format("YYYY-MM-DD"),
          });
        }
        setOpen(false);
        refetch();                        // refresh list
      } catch (err) {
        console.error(err);
        alert(
          err.response?.data?.detail ||
          "Request failed – see console / backend logs"
        );
      }
    };
  
    /* ------------- render ------------------ */
    return (
      <AdminCard sx={{ maxWidth: 960 }}>
        {/* header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PeopleIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>Members</Typography>
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
        ) : (
          <TableContainer
            component={Box}
            sx={{ borderRadius: 1, boxShadow: 1, overflow: "hidden" }}
          >
            <Table sx={{ "& tbody tr:nth-of-type(odd)": { bgcolor: "action.hover" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>National&nbsp;ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Last&nbsp;Login</TableCell>
                  <TableCell width={200}>Assign&nbsp;Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((m, idx) => (
                  <TableRow key={m.mid ?? idx}>
                    <TableCell>{m.fname} {m.lname}</TableCell>
                    <TableCell>{m.national_id}</TableCell>
                    <TableCell>{m.username ?? "—"}</TableCell>
                    <TableCell>{m.last_login ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value=""
                        onChange={(e) => handleSelect(m, e.target.value)}
                        renderValue={() => "Select…"}
                      >
                        {ALL_ROLES.map((r) => (
                          <MenuItem key={r} value={r}>{r}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
  
        {/* ---------------- dialog --------------- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogRole === "STUDENT"
              ? `Create student record for ${member?.fname}`
              : `Assign “${dialogRole}” to ${member?.fname}`}
          </DialogTitle>
  
          <DialogContent sx={{ pt: 2 }}>
            {dialogRole === "STUDENT" ? (
              <TextField
                select
                label="Major"
                value={majorName}
                onChange={(e) => setMajorName(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              >
                {majors.map((mj) => (
                  <MenuItem key={mj.major_id} value={mj.major_name}>
                    {mj.major_name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                label="Department"
                value={departmentName}
                onChange={(e) => setDeptName(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              >
                {departments.map((d) => (
                  <MenuItem key={d.did} value={d.department_name}>
                    {d.department_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </DialogContent>
  
          <DialogActions sx={{ pr: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={
                dialogRole === "STUDENT" ? !majorName : !departmentName
              }
              onClick={handleSubmit}
            >
              {dialogRole === "STUDENT" ? "Create Record" : "Assign Role"}
            </Button>
          </DialogActions>
        </Dialog>
      </AdminCard>
    );
  }
  