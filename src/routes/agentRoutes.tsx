import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AgentDashboard from '@/pages/dashboard/AgentDashboard';
import LeadsPage from '@/pages/dashboard/LeadsPage';
import MeetingsListPage from '@/pages/dashboard/MeetingsListPage';
import MeetingsAgendaPage from '@/pages/dashboard/MeetingsAgendaPage';

export default function AgentRoutes() {
  return (
    <Routes>
      <Route index element={<AgentDashboard />} />
      <Route path="leads" element={<LeadsPage />} />
      <Route path="meetings" element={<Navigate to="/dashboard/meetings/list" replace />} />
      <Route path="meetings/list" element={<MeetingsListPage />} />
      <Route path="meetings/agenda" element={<MeetingsAgendaPage />} />
      {/* Add other agent routes as needed */}
    </Routes>
  );
}
