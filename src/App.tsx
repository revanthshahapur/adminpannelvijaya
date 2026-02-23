import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";

import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentForm from "./pages/StudentForm";
import StudentView from "./pages/StudentView"; // ✅ UPDATED (was StudentProfile)
import Faculty from "./pages/Faculty";
import Fees from "./pages/Fees";
import Payments from "./pages/Payments";
import Payroll from "./pages/Payroll";
import Courses from "./pages/Courses";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppStore();

  return user?.isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<Login />} />

            {/* Protected Layout Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Default Redirect */}
              <Route index element={<Navigate to="dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<Notifications />} />

              {/* Students */}
              <Route path="students" element={<Students />} />
              <Route path="students/new" element={<StudentForm />} />
              <Route path="students/:id" element={<StudentView />} /> {/* ✅ FIXED */}
              <Route path="students/:id/edit" element={<StudentForm />} />

              {/* Other Modules */}
              <Route path="faculty" element={<Faculty />} />
              <Route path="fees" element={<Fees />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="courses" element={<Courses />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
