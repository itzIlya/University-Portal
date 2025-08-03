import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import FormField from "../molecules/FormField";
import Button from "../atoms/Button";
import api from "../../api/axios";

import { useNavigate } from "react-router-dom";         // ★ CHANGED
import { useAuth } from "../../context/AuthContext";    // ★ CHANGED




export default function SignInForm() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);


  const navigate  = useNavigate();   // ★ CHANGED
  const { login } = useAuth();       // ★ CHANGED


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = {};
    if (!formData.username) errs.username = "Username required";
    if (!formData.password) errs.password = "Password required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      const res = await api.post("signin", formData);
    
      console.log("Signed in:", res.data);
      login({ ...res.data, isAdmin: res.data.is_admin });
    
      if (res.data.is_admin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    }
    
    
    
    catch (err) {
      console.error("Sign-in error:", err);
      const data = err.response?.data;
      if (data) {
        alert(Object.values(data).flat().join("\n") || "Invalid credentials");
      } else if (err.response?.status === 400) {
        alert("Bad request: Check username and password format");
      } else if (err.response?.status === 403) {
        alert("CSRF token missing or invalid");
      } else if (err.response?.status === 500) {
        alert("Server error: Please try again later");
      } else {
        alert("Network error: Unable to connect to server");
      }
    }
  };

  return (
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
                  onClick={() => setShowPw(!showPw)}
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
  );
}