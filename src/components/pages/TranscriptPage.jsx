import { Box, Stack, Typography, Divider } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect } from "react";
import TopNavbar from "../organisms/TopNavbar";
import axios from "../../api/axios";

/* columns shared by both grids */
/* ------------- DataGrid column defs ------------- */
const columns = [
    { field: 'code',  headerName: 'Course', width: 120 },
    { field: 'title', headerName: 'Title',  flex: 1   },
    { field: 'term',  headerName: 'Term',   width: 120 },
    {
      field: 'grade',
      headerName: 'Grade',
      width: 100,
      align: 'center',
      headerAlign: 'center',
  
      renderCell: (params) => {
        const v = params.value;        // already row.grade
        return v == null ? '—' : v;    // dash or number
      },
    },
  ];
  
  

export default function TranscriptPage() {
  const [current, setCurrent] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [gpa, setGpa] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/mock/transcript/");
        const now = data.filter((c) => c.grade === null);
        const past = data.filter((c) => c.grade !== null);
        setCurrent(now);
        setCompleted(past);

        /* simple GPA = weighted avg of grade/20 * 4 (convert to 4-pt) */
        const totCredits = past.reduce((s, c) => s + c.credits, 0);
        const totPoints = past.reduce(
          (s, c) => s + (c.grade / 20) * 4 * c.credits,
          0
        );
        setGpa(totCredits ? (totPoints / totCredits).toFixed(2) : null);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <>
      <TopNavbar />

      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={4} maxWidth="1000px" mx="auto">
          <Typography variant="h4" fontWeight={700} textAlign="center">
            Transcript
          </Typography>

          {/* current enrolments */}
          <div>
            <Typography variant="h6" mb={1}>
              Current Courses
            </Typography>
            <DataGrid
              rows={current}
              columns={columns}
              autoHeight
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              getRowId={(r) => r.id}
              density="comfortable"
              sx={{ mb: 2, bgcolor: "background.paper", borderRadius: 2 }}
            />
          </div>

          <Divider />

          {/* completed */}
          <div>
            <Typography variant="h6" mb={1}>
              Completed Courses
            </Typography>
            <DataGrid
              rows={completed}
              columns={columns}
              autoHeight
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              getRowId={(r) => r.id}
              density="comfortable"
              sx={{ mb: 2, bgcolor: "background.paper", borderRadius: 2 }}
            />
            {gpa && (
              <Box
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  p: 2,
                  display: "inline-block",
                  boxShadow: 1,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  Total&nbsp;GPA:&nbsp;{gpa}
                </Typography>
              </Box>
            )}
          </div>
        </Stack>
      </Box>
    </>
  );
}
