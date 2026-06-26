import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExamPage from './pages/ExamPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import ResultsPage from './pages/ResultsPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import StudentRegisterPage from './pages/StudentRegisterPage';

// Simple PrivateRoute to guard routes based on token existence
const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Basic role check if needed
  if (role && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role !== role) {
        // Redirigir al dashboard correcto si no tiene el rol
        return <Navigate to={user.role === 'TEACHER' ? '/teacher-dashboard' : '/dashboard'} replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
<Route path="/login" element={<LoginPage />} />
        <Route path="/register/teacher" element={<TeacherRegisterPage />} />
        <Route path="/register/student" element={<StudentRegisterPage />} />
        
        {/* Rutas Estudiante */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute role="STUDENT">
              <DashboardPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/exam/:id" 
          element={
            <PrivateRoute role="STUDENT">
              <ExamPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/results" 
          element={
            <PrivateRoute role="STUDENT">
              <ResultsPage />
            </PrivateRoute>
          } 
        />

        {/* Ruta Profesor */}
        <Route 
          path="/teacher-dashboard" 
          element={
            <PrivateRoute role="TEACHER">
              <TeacherDashboardPage />
            </PrivateRoute>
          } 
        />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
