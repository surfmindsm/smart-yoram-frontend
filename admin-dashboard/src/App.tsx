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
          <Route path="announcements" element={<Announcements />} />
          <Route path="sms" element={<SMSManagement />} />
          <Route path="qr-codes" element={<QRCodeManagement />} />
          <Route path="statistics" element={<StatisticsDashboard />} />
          <Route path="excel" element={<ExcelManagement />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="bulletins" element={<Bulletins />} />
          <Route path="daily-verses" element={<DailyVerses />} />
          <Route path="church" element={<ChurchInfo />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
