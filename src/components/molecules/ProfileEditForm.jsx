import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import api from "../../api/axios";

export default function ProfileEditForm({ memberMid, onSaved, onCancel }) {
  const [form, setForm] = useState({
    fname: "",
    lname: "",
    national_id: "",
    birthday: "",
    username: "",
  });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get("/me")
      .then(({ data }) => {
        setForm({
          fname: data.fname || "",
          lname: data.lname || "",
          national_id: data.national_id || "",
          birthday: data.birthday || "",
          username: data.username || "",
        });
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key) => (e) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    api.put(`/profile${memberMid ? `?member_mid=${memberMid}` : ""}`, form)
      .then(() => onSaved && onSaved(form))
      .catch(err => setError(err.response?.data?.detail || "Update failed"));
  };

  if (loading) return <CircularProgress size={24} />;
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        <TextField
          label="First Name"
          required
          value={form.fname}
          onChange={handleChange("fname")}
        />
        <TextField
          label="Last Name"
          required
          value={form.lname}
          onChange={handleChange("lname")}
        />
        <TextField
          label="National ID"
          required
          value={form.national_id}
          onChange={handleChange("national_id")}
        />
        <TextField
          label="Birthday"
          type="date"
          InputLabelProps={{ shrink: true }}
          required
          value={form.birthday}
          onChange={handleChange("birthday")}
        />
        <TextField
          label="Username"
          value={form.username}
          onChange={handleChange("username")}
        />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
