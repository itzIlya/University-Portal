
import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import useCrudList from "../../../hooks/useCrudList";
import api from "../../../api/axios";
import AdminCard from "../../molecules/AdminCard";
import dayjs from "dayjs";

const emptyDept = { department_name: "", location: "" };

export default function DepartmentPage() {
  // create + list hook for departments
  const { items, loading, error, setError, newItem, setNewItem, create } =
    useCrudList("departments", emptyDept);

  // members list (for selecting a head)
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [headData, setHeadData] = useState({
    national_id: "",
    start_date: dayjs().format("YYYY-MM-DD"),
    end_date: "",
  });

  // fetch all members once
  useEffect(() => {
    (async () => {
      setMembersLoading(true);
      try {
        const { data } = await api.get("/members");
        setMembers(data);
      } catch {
 
      } finally {
        setMembersLoading(false);
      }
    })();
  }, []);

  // open assign‐head dialog
  const openDialog = (dept) => {
    setSelectedDept(dept);
    setHeadData({
      national_id: "",
      start_date: dayjs().format("YYYY-MM-DD"),
      end_date: "",
    });
    setDialogOpen(true);
  };

  // submit assign head
  const submitHead = async () => {
    try {
      await api.post("/staff-roles", {
        national_id: headData.national_id,
        department_name: selectedDept.department_name,
        staff_role: "HEAD",
        start_date: headData.start_date,
        end_date: headData.end_date || null,
      });
      // update the head label locally
      const m = members.find((x) => x.national_id === headData.national_id);
      const label = m ? `${m.fname} ${m.lname}` : "—";
      items.forEach((d) => {
        if (d.did === selectedDept.did) d.department_head_name = label;
      });
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to assign head");
    }
  };

  // create‐form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.department_name || !newItem.location) {
      setError("All fields are required");
      return;
    }
    create();
  };

  return (
    <AdminCard>
      {/* Create Department */}
      <Typography variant="h6" mb={2}>
        Create Department
      </Typography>
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
        mb={4}
      >
        <TextField
          label="Department"
          required
          value={newItem.department_name}
          onChange={(e) =>
            setNewItem({ ...newItem, department_name: e.target.value })
          }
        />
        <TextField
          label="Location"
          required
          value={newItem.location}
          onChange={(e) =>
            setNewItem({ ...newItem, location: e.target.value })
          }
        />
        <Button variant="contained" type="submit">
          Add
        </Button>
      </Stack>

      {/* Departments Table */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <BusinessIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Departments
          </Typography>
        </Stack>
        <Chip color="primary" label={items.length} />
      </Stack>

      {loading ? (
        <Stack alignItems="center" my={4}>
          <CircularProgress />
        </Stack>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">No departments found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table
            sx={{
              "& tbody tr:nth-of-type(odd)": { bgcolor: "action.hover" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Head</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.did}>
                  <TableCell>{d.department_name}</TableCell>
                  <TableCell>{d.location}</TableCell>
                  <TableCell>{d.department_head_name || "—"}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => openDialog(d)}
                      disabled={Boolean(d.department_head_name)}
                    >
                      {d.department_head_name ? "Head Assigned" : "Assign Head"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign Head Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Assign Head for {selectedDept?.department_name || ""}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Member"
            value={headData.national_id}
            onChange={(e) =>
              setHeadData({ ...headData, national_id: e.target.value })
            }
            sx={{ mt: 2 }}
            disabled={membersLoading}
          >
            <MenuItem value="">
              {membersLoading ? "Loading…" : "Select member…"}
            </MenuItem>
            {members.map((m) => (
              <MenuItem key={m.national_id} value={m.national_id}>
                {m.fname} {m.lname}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="Start Date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
            value={headData.start_date}
            onChange={(e) =>
              setHeadData({ ...headData, start_date: e.target.value })
            }
          />
          <TextField
            type="date"
            label="End Date (optional)"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
            value={headData.end_date}
            onChange={(e) =>
              setHeadData({ ...headData, end_date: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!headData.national_id}
            onClick={submitHead}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </AdminCard>
  );
}