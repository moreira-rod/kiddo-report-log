import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Students from "./pages/Students";
import Evaluation from "./pages/Evaluation";
import Timeline from "./pages/Timeline";
import Classes from "./pages/Classes";
import ParentDashboard from "./pages/ParentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import AdminConsole from "./pages/AdminConsole";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Students />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/evaluation/:studentId" element={<Evaluation />} />
          <Route path="/timeline/:studentId" element={<Timeline />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/management-dashboard" element={<ManagementDashboard />} />
          <Route path="/admin" element={<AdminConsole />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
