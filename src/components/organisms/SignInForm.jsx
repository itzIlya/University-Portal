// src/components/molecules/SignInForm.jsx
import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import FormField from "../molecules/FormField";
import Button from "../atoms/Button";
import api from "../../api/axios";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors,   setErrors]   = useState({ username: "", password: "" });
  const [showPw,   setShowPw]   = useState(false);
  const [snack,    setSnack]    = useState({ open:false, msg:"", sev:"error" });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // client-side validation
    const errs = {};
    if (!formData.username) errs.username = "Username required";
    if (!formData.password) errs.password = "Password required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      // 1) sign in
      const res = await api.post("signin", formData);
      login({ ...res.data, isAdmin: res.data.is_admin });

      // 2) redirect based on role
      if (res.data.is_admin) {
        return navigate("/admin", { replace: true });
      }

      // non-admin: check if professor (teaches any section)
      try {
        const profRes = await api.get("my-presented-courses");
        if (profRes.data.length > 0) {
          return navigate("/professor", { replace: true });
        }
      } catch {
        /* if this call fails, we'll just treat as student */
      }

      // default → student
      navigate("/student", { replace: true });
    }
    catch (err) {
      console.error("Sign-in error:", err);
      const data = err.response?.data;
      const msg =
        data?.detail ||
        Object.values(data || {}).flat().join("\n") ||
        (err.response?.status === 400
          ? "Bad request: Check username/password"
          : err.response?.status === 403
          ? "CSRF token missing or invalid"
          : err.response?.status === 500
          ? "Server error: Please try again later"
          : "Network error: Unable to connect");
      setSnack({ open: true, msg, sev: "error" });
    }
  };

  return (
    <>
      <Box
        component="section"
        sx={{
          bgcolor: "background.paper",
          p: 4,
          borderRadius: 3,
          boxShadow: 4,
          width: "100%",
          maxWidth: 460,
        }}
      > 
        <Typography variant="h4" fontWeight={700} textAlign="center" mb={3}>
          Sign&nbsp;in
        </Typography>

        <Stack component="form" onSubmit={handleSubmit} spacing={3}>
          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username}
            fullWidth
          />

          <FormField
            label="Password"
            name="password"
            type={showPw ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" variant="contained" fullWidth sx={{ py: 1.2 }}>
            Sign&nbsp;in
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.sev}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
