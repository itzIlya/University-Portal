// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import RegistrationPage from "./components/pages/RegistrationPage";
import SignInPage from "./components/pages/SignInPage";
import RequireAdmin from "./components/routes/RequireAdmin";
import AdminDashboard from "./components/pages/AdminDashboard";
import SemesterPage from "./components/pages/admin/SemesterPage";
import DepartmentPage from "./components/pages/admin/DepartmentPage";
import MajorPage from "./components/pages/admin/MajorPage";
import MemberPage from "./components/pages/admin/MemberPage";
import CourseCreatePage from "./components/pages/admin/CourseCreatePage";
import PresentedCoursePage from "./components/pages/admin/PresentedCoursePage";
import RoomPage from "./components/pages/admin/RoomPage";

import StudentDashboard from "./components/pages/student/StudentDashboard";
import StudentSemestersPage from "./components/pages/student/StudentSemestersPage";
import StudentCoursesPage from "./components/pages/student/StudentCoursesPage";

//import TestRecords from "./components/pages/student/TestRecords";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RegistrationPage />} />
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
        <Route path="members" element={<MemberPage />} />
        <Route path="courses" element={<CourseCreatePage />} />
        <Route path="rooms" element={<RoomPage />} />
        <Route path="presented" element={<PresentedCoursePage />} />
      </Route>

       {/* student: three independent pages */}
       <Route path="/student"            element={<StudentDashboard />} />
      <Route path="/student/semesters"  element={<StudentSemestersPage />} />
      <Route path="/student/semesters/:sid" element={<StudentCoursesPage />} />
    </Routes>
  );
}

export default App;
