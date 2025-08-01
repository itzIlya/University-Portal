/* -------------------------------- MemberPage.jsx -------------------------- */
import React, { useState, useEffect } from "react";
import {
  Box, Stack, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, TextField
} from "@mui/material";
import AddIcon     from "@mui/icons-material/Add";
import PeopleIcon  from "@mui/icons-material/People";
import dayjs       from "dayjs";

import api          from "../../../api/axios";
import useCrudList  from "../../../hooks/useCrudList";
import AdminCard    from "../../molecules/AdminCard";

/* ───────────────────────── constants ───────────────────────── */
const STAFF_ROLES   = ["INSTRUCTOR", "CLERK", "CHAIR", "ADMIN", "PROF"];
const ALL_ROLES     = ["STUDENT", ...STAFF_ROLES];

/* localStorage helpers → survive page reloads while testing */
const LS_KEY = "member_roles_cache";
const loadRoles = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
};
const saveRoles = (map) => localStorage.setItem(LS_KEY, JSON.stringify(map));

/* ───────────────────────── component ───────────────────────── */
export default function MemberPage() {
  /* ---- master lists ---- */
  const { items: members,     loading, error, setError } = useCrudList("members", {});
  const { items: majors   } = useCrudList("majors",      {});
  const { items: depts    } = useCrudList("departments", {});
  /* roles already stored in DB are **not** returned by /members.
     We’ll cache the ones we add so the UI can show them instantly. */
  const [roleMap, setRoleMap] = useState(loadRoles);
  useEffect(() => saveRoles(roleMap), [roleMap]);

  /* ---- dialog state ---- */
  const [open, setOpen]       = useState(false);
  const [stage, setStage]     = useState("pick");  // "pick" ─or─ "form"
  const [member, setMember]   = useState(null);
  const [role, setRole]       = useState("");

  /* dynamic form fields */
  const [major,      setMajor]      = useState("");
  const [department, setDepartment] = useState("");
  const [startDate,  setStartDate]  = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate,    setEndDate]    = useState("");

  /* ─── helpers ─────────────────────────────────────────────── */
  /** push *new* role to cache (multiple per user allowed) */
  const cacheAdd = (mid, payload) =>
    setRoleMap((prev) => ({
      ...prev,
      [mid]: [...(prev[mid] || []), payload],
    }));

  /** step-1: choose role */
  const handleAddClick = (mem) => { setMember(mem); setStage("pick"); setOpen(true); };

  /** step-2: after role selected */
  const handleRolePicked = (r) => {
    setRole(r);
    /* reset per-role form fields */
    setMajor(""); setDepartment(""); setStartDate(dayjs().format("YYYY-MM-DD")); setEndDate("");
    setStage("form");
  };

  /** final submit → call correct endpoint(s) */
  const handleSubmit = async () => {
    try {
      if (role === "STUDENT") {
        /* ---- student record ---- */
        await api.post("student-records", {
          national_id: member.national_id,
          major_name : major,
        });
        cacheAdd(member.mid, { role: "STUDENT", major });
      } else {
        /* ---- make sure person is staff first (promote is idempotent) ---- */
        await api.post("staff", { national_id: member.national_id });
        /* ---- then assign staff role ---- */
        await api.post("staff-roles", {
          national_id    : member.national_id,
          department_name: department,
          staff_role     : role,
          start_date     : startDate,
          end_date       : endDate || null,
        });
        cacheAdd(member.mid, { role, department, startDate, endDate });
      }
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail ?? "Server error – see console");
    }
  };

  /* ─── UI ───────────────────────────────────────────────────── */
  return (
    <AdminCard sx={{ maxWidth: 1280 }}>
      {/* header */}
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>Members</Typography>
        </Stack>
        <Chip color="primary" label={members.length} />
      </Stack>

      {error && (
        <Alert sx={{ mb:2 }} severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack alignItems="center" my={4}><CircularProgress /></Stack>
      ) : (
        <TableContainer component={Box} sx={{ borderRadius:1, boxShadow:1 }}>
          <Table sx={{ "& tbody tr:nth-of-type(odd)": { bgcolor:"action.hover" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>National&nbsp;ID</TableCell>
                <TableCell>Username</TableCell>
                {/* <TableCell>Last&nbsp;Login</TableCell> */}
                <TableCell>Roles</TableCell>
                <TableCell width={80}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.mid}>
                  <TableCell>{m.fname} {m.lname}</TableCell>
                  <TableCell>{m.national_id}</TableCell>
                  <TableCell>{m.username ?? "—"}</TableCell>
                  {/* <TableCell>{m.last_login ?? "—"}</TableCell> */}
                  <TableCell>
                    {(roleMap[m.mid] || []).map((r, i) => (
                      <Chip
                        key={i}
                        label={
                          r.role === "STUDENT"
                            ? `${r.role} – ${r.major}`
                            : `${r.role}${r.department ? " – " + r.department : ""}`
                        }
                        size="small"
                        color={r.role === "STUDENT" ? "success" : "info"}
                        sx={{ mr: 0.5, mb:0.5 }}
                      />
                    ))}
                    {roleMap[m.mid]?.length === 0 && "—"}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleAddClick(m)}>
                      <AddIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ───────── dialog (pick → form) ───────── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        {/* step A – choose which role */}
        {stage === "pick" && (
          <>
            <DialogTitle>Add new role for {member?.fname}</DialogTitle>
            <DialogContent>
              <TextField
                select
                fullWidth
                label="Role"
                value={role}
                onChange={(e) => handleRolePicked(e.target.value)}
                sx={{ mt: 2 }}
              >
                {ALL_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            </DialogContent>
          </>
        )}

        {/* step B – gather extra info */}
        {stage === "form" && (
          <>
            <DialogTitle>
              {role === "STUDENT"
                ? `Student record for ${member?.fname}`
                : `Assign ${role} role`}
            </DialogTitle>

            <DialogContent sx={{ pt:2 }}>
              {role === "STUDENT" ? (
                <TextField
                  select fullWidth required
                  label="Major"
                  value={major}
                  onChange={(e)=>setMajor(e.target.value)}
                  sx={{ mb:2 }}
                >
                  {majors.map((mj)=>(
                    <MenuItem key={mj.major_id} value={mj.major_name}>{mj.major_name}</MenuItem>
                  ))}
                </TextField>
              ) : (
                <>
                  <TextField
                    select fullWidth required
                    label="Department"
                    value={department}
                    onChange={(e)=>setDepartment(e.target.value)}
                    sx={{ mb:2 }}
                  >
                    {depts.map((d)=>(
                      <MenuItem key={d.did} value={d.department_name}>
                        {d.department_name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Stack direction={{xs:"column", sm:"row"}} spacing={2} sx={{ mb:2 }}>
                    <TextField
                      label="Start Date" type="date" fullWidth required
                      value={startDate}
                      onChange={(e)=>setStartDate(e.target.value)}
                      InputLabelProps={{ shrink:true }}
                    />
                    <TextField
                      label="End Date (optional)" type="date" fullWidth
                      value={endDate}
                      onChange={(e)=>setEndDate(e.target.value)}
                      InputLabelProps={{ shrink:true }}
                    />
                  </Stack>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ pr:3, pb:2 }}>
              <Button onClick={()=>setStage("pick")}>Back</Button>
              <Button
                variant="contained"
                disabled={ role==="STUDENT" ? !major : (!department || !startDate) }
                onClick={handleSubmit}
              >
                Save
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AdminCard>
  );
}
