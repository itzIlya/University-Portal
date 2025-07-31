import { Routes, Route, Navigate } from "react-router-dom";
import RegistrationPage from "./components/pages/RegistrationPage";
import CoursesPage from "./components/pages/CoursesPage";
import TranscriptPage from "./components/pages/TranscriptPage";
import SignInPage from "./components/pages/SignInPage";
import RequireAdmin from "./components/routes/RequireAdmin";
import AdminDashboard from "./components/pages/AdminDashboard";
import SemesterPage from "./components/pages/admin/SemesterPage";
import DepartmentPage from "./components/pages/admin/DepartmentPage";
import MajorPage from "./components/pages/admin/MajorPage";
import MemberPage from "./components/pages/admin/MemberPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RegistrationPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/transcript" element={<TranscriptPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="semesters" replace />} />
        <Route path="semesters" element={<SemesterPage />} />
        <Route path="departments" element={<DepartmentPage />} />
        <Route path="majors" element={<MajorPage />} />
        <Route path="members"     element={<MemberPage />} /> 
      </Route>


    </Routes>
  );
}

export default App;