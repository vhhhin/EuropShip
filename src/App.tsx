import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AgentProvider } from '@/contexts/AgentContext';
import { TimeTrackingProvider } from "@/contexts/TimeTrackingContext";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import LeadsPage from "./pages/dashboard/LeadsPage";
import MeetingsPage from "./pages/dashboard/MeetingsPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import TimeTrackingPage from "./pages/dashboard/TimeTrackingPage";
import NotFound from "./pages/NotFound";
import AgentsPage from '@/pages/dashboard/AgentsPage';
import MeetingsListPage from '@/pages/dashboard/MeetingsListPage';
import MeetingsAgendaPage from '@/pages/dashboard/MeetingsAgendaPage';

const queryClient = new QueryClient();

const App = () => {
  // Ensure dark mode is always applied
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <NotificationProvider>
            <AgentProvider>
              <TimeTrackingProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<DashboardLayout />}>
                      <Route index element={<DashboardOverview />} />
                      <Route path="leads" element={<LeadsPage />} />
                      <Route path="agents" element={<AgentsPage />} />
                      
                      {/* Meetings routes */}
                      <Route path="meetings" element={<Navigate to="/dashboard/meetings/list" replace />} />
                      <Route path="meetings/list" element={<MeetingsListPage />} />
                      <Route path="meetings/agenda" element={<MeetingsAgendaPage />} />
                      
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="time" element={<TimeTrackingPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TimeTrackingProvider>
            </AgentProvider>
          </NotificationProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
