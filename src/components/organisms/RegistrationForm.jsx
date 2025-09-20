import { useState } from "react";
import { Box, Grid, Stack } from "@mui/material";
import FormField from "../molecules/FormField";
import Button from "../atoms/Button";
import Typography from "../atoms/Typography";
import api from "../../api/axios";

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    national_id: "",
    birthday: "",
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    fname: "",
    lname: "",
    national_id: "",
    birthday: "",
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!formData.fname) newErrors.fname = "Name is required";
    if (!formData.lname) newErrors.lname = "Last name is required";
    if (!formData.national_id) newErrors.national_id = "National # is required";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await api.post(
        "signup", 
        {
          fname: formData.fname,
          lname: formData.lname,
          national_id: formData.national_id,
          birthday: formData.birthday,
          username: formData.username,
          password: formData.password,
        }
      );

      console.log("Signed up:", res.data);
      window.alert("Success! Account created.");






    } catch (err) {
      console.error("Sign-up error:", err);
      const data = err.response?.data;
      if (data) {
        alert(Object.values(data).flat().join("\n") || "Registration failed");
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
        px: { xs: 3, sm: 4 },
        py: { xs: 4, sm: 6 },
        borderRadius: 3,
        boxShadow: 4,
        width: "100%",
        maxWidth: 700,
      }}
    >
      <Typography variant="h4" fontWeight={700} textAlign="center" mb={3}>
         Sign-up
      </Typography>

      <Stack component="form" onSubmit={handleSubmit} spacing={3}>
        <Grid container spacing={3} justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <FormField
              label="First name"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              error={!!errors.fname}
              helperText={errors.fname}
              fullWidth
              sx={{
                minWidth: "100%",
                "& .MuiInputBase-root": {
                  height: 48,
                  width: "100%",
                  minWidth: 300,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              label="Last name"
              name="lname"
              value={formData.lname}
              onChange={handleChange}
              error={!!errors.lname}
              helperText={errors.lname}
              fullWidth
              sx={{
                minWidth: "100%",
                "& .MuiInputBase-root": {
                  height: 48,
                  width: "100%",
                  minWidth: 300,
                },
              }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <FormField
              label="National ID"
              name="national_id"
              value={formData.national_id}
              onChange={handleChange}
              error={!!errors.national_id}
              helperText={errors.national_id}
              fullWidth
              sx={{
                minWidth: "100%",
                "& .MuiInputBase-root": {
                  height: 48,
                  width: "100%",
                  minWidth: 300,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              label="Birthday"
              name="birthday"
              type="date"
              value={formData.birthday}
              onChange={handleChange}
              error={!!errors.birthday}
              helperText={errors.birthday}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: "100%",
                "& .MuiInputBase-root": {
                  height: 48,
                  width: "100%",
                  minWidth: 300,
                },
              }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <FormField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              fullWidth
              sx={{
                minWidth: "100%",
                "& .MuiInputBase-root": {
                  height: 48,
                  width: "100%",
                  minWidth: 300,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              sx={{
                minWidth: "100%",
                "& .MuiInputBase-root": {
                  height: 48,
                  width: "100%",
                  minWidth: 300,
                },
              }}
            />
          </Grid>
        </Grid>

        <Button type="submit" variant="contained" fullWidth sx={{ py: 1.2 }}>
          Register
        </Button>
      </Stack>
    </Box>
  );
};

export default RegistrationForm;
