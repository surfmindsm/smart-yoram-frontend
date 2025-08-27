import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import SermonLibrary from './components/SermonLibrary';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Members = lazy(() => import('./components/Members'));
const MemberManagement = lazy(() => import('./components/MemberManagement'));
const Announcements = lazy(() => import('./components/Announcements'));
const SMSManagement = lazy(() => import('./components/SMSManagement'));
const QRCodeManagement = lazy(() => import('./components/QRCodeManagement'));
const StatisticsDashboard = lazy(() => import('./components/StatisticsDashboard'));
const ExcelManagement = lazy(() => import('./components/ExcelManagement'));
const Attendance = lazy(() => import('./components/Attendance'));
const Bulletins = lazy(() => import('./components/Bulletins'));
const ChurchInfo = lazy(() => import('./components/ChurchInfo'));
const DailyVerses = lazy(() => import('./components/DailyVerses'));
const WorshipScheduleManagement = lazy(() => import('./components/worship/WorshipScheduleManagement'));
const PushNotifications = lazy(() => import('./components/PushNotifications'));
const AIChat = lazy(() => import('./components/AIChat'));
const AIAgentManagement = lazy(() => import('./components/AIAgentManagement'));
const ChurchSettings = lazy(() => import('./components/ChurchSettings'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const PastoralCareManagement = lazy(() => import('./components/PastoralCareManagement'));
const PrayerRequestManagement = lazy(() => import('./components/PrayerRequestManagement'));
const DonationManagement = lazy(() => import('./components/DonationManagement'));
const AddMemberWizard = lazy(() => import('./components/AddMemberWizard'));
const GPTSettings = lazy(() => import('./pages/GPTSettings'));

// AI Tools
const AITools = lazy(() => import('./components/AITools'));
const SermonWriter = lazy(() => import('./components/ai-tools/SermonWriter'));
const PrayerGenerator = lazy(() => import('./components/ai-tools/PrayerGenerator'));
const AnnouncementWriter = lazy(() => import('./components/ai-tools/AnnouncementWriter'));
const BulletinContent = lazy(() => import('./components/ai-tools/BulletinContent'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

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
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="members" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Members />
            </Suspense>
          } />
          <Route path="member-management" element={
            <Suspense fallback={<LoadingSpinner />}>
              <MemberManagement />
            </Suspense>
          } />
          <Route path="add-member" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AddMemberWizard />
            </Suspense>
          } />
          <Route path="donations" element={
            <Suspense fallback={<LoadingSpinner />}>
              <DonationManagement />
            </Suspense>
          } />
          <Route path="ai-chat" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AIChat />
            </Suspense>
          } />
          <Route path="ai-agent-management" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AIAgentManagement />
            </Suspense>
          } />
          <Route path="sermon-library" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SermonLibrary />
            </Suspense>
          } />
          <Route path="church-settings" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ChurchSettings />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AnalyticsDashboard />
            </Suspense>
          } />
          <Route path="announcements" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Announcements />
            </Suspense>
          } />
          <Route path="pastoral-care" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PastoralCareManagement />
            </Suspense>
          } />
          <Route path="prayer-requests" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PrayerRequestManagement />
            </Suspense>
          } />
          <Route path="sms" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SMSManagement />
            </Suspense>
          } />
          <Route path="qr-codes" element={
            <Suspense fallback={<LoadingSpinner />}>
              <QRCodeManagement />
            </Suspense>
          } />
          <Route path="statistics" element={
            <Suspense fallback={<LoadingSpinner />}>
              <StatisticsDashboard />
            </Suspense>
          } />
          <Route path="excel" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ExcelManagement />
            </Suspense>
          } />
          <Route path="attendance" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Attendance />
            </Suspense>
          } />
          <Route path="bulletins" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Bulletins />
            </Suspense>
          } />
          <Route path="daily-verses" element={
            <Suspense fallback={<LoadingSpinner />}>
              <DailyVerses />
            </Suspense>
          } />
          <Route path="church" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ChurchInfo />
            </Suspense>
          } />
          <Route path="worship-schedule" element={
            <Suspense fallback={<LoadingSpinner />}>
              <WorshipScheduleManagement />
            </Suspense>
          } />
          <Route path="push-notifications" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PushNotifications />
            </Suspense>
          } />
          <Route path="gpt-settings" element={
            <Suspense fallback={<LoadingSpinner />}>
              <GPTSettings />
            </Suspense>
          } />
          <Route path="ai-tools" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AITools />
            </Suspense>
          } />
          <Route path="ai-tools/sermon-writer" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SermonWriter />
            </Suspense>
          } />
          <Route path="ai-tools/prayer-generator" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PrayerGenerator />
            </Suspense>
          } />
          <Route path="ai-tools/announcement-writer" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AnnouncementWriter />
            </Suspense>
          } />
          <Route path="ai-tools/bulletin-content" element={
            <Suspense fallback={<LoadingSpinner />}>
              <BulletinContent />
            </Suspense>
          } />
          <Route path="pastoral-care" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PastoralCareManagement />
            </Suspense>
          } />
          <Route path="prayer-requests" element={
            <Suspense fallback={<LoadingSpinner />}>
              <PrayerRequestManagement />
            </Suspense>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
