import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import MemberManagement from './components/MemberManagement';
import Announcements from './components/Announcements';
import SMSManagement from './components/SMSManagement';
import QRCodeManagement from './components/QRCodeManagement';
import StatisticsDashboard from './components/StatisticsDashboard';
import ExcelManagement from './components/ExcelManagement';
import Attendance from './components/Attendance';
import Bulletins from './components/Bulletins';
import ChurchInfo from './components/ChurchInfo';
import DailyVerses from './components/DailyVerses';
import WorshipScheduleManagement from './components/worship/WorshipScheduleManagement';
import PushNotifications from './components/PushNotifications';
import AIChat from './components/AIChat';
import AIAgentManagement from './components/AIAgentManagement';
import ChurchSettings from './components/ChurchSettings';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="member-management" element={<MemberManagement />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="ai-agent-management" element={<AIAgentManagement />} />
          <Route path="church-settings" element={<ChurchSettings />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="sms" element={<SMSManagement />} />
          <Route path="qr-codes" element={<QRCodeManagement />} />
          <Route path="statistics" element={<StatisticsDashboard />} />
          <Route path="excel" element={<ExcelManagement />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="bulletins" element={<Bulletins />} />
          <Route path="daily-verses" element={<DailyVerses />} />
          <Route path="church" element={<ChurchInfo />} />
          <Route path="worship-schedule" element={<WorshipScheduleManagement />} />
          <Route path="push-notifications" element={<PushNotifications />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
