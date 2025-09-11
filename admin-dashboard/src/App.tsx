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
const SystemAnnouncementManagement = lazy(() => import('./components/SystemAnnouncementManagement'));
const AnnouncementManagement = lazy(() => import('./components/AnnouncementManagement'));
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
const SecurityLogs = lazy(() => import('./components/SecurityLogs'));

// Community Components
const CommunityHome = lazy(() => import('./components/Community/CommunityHome'));
const FreeSharing = lazy(() => import('./components/Community/FreeSharing'));
const CreateSharing = lazy(() => import('./components/Community/CreateSharing'));
const FreeSharingDetail = lazy(() => import('./components/Community/FreeSharingDetail'));
const CreateItemRequest = lazy(() => import('./components/Community/CreateItemRequest'));
const CreateSharingOffer = lazy(() => import('./components/Community/CreateSharingOffer'));
const CreateCommunityPost = lazy(() => import('./components/Community/CreateCommunityPost'));
const CreateJobPosting = lazy(() => import('./components/Community/CreateJobPosting'));
const CreateJobSeeking = lazy(() => import('./components/Community/CreateJobSeeking'));
const CreateMusicTeamRecruit = lazy(() => import('./components/Community/CreateMusicTeamRecruit'));
const CreateMusicTeamSeeking = lazy(() => import('./components/Community/CreateMusicTeamSeeking'));
const CreateChurchEvents = lazy(() => import('./components/Community/CreateChurchEvents'));
const ItemRequest = lazy(() => import('./components/Community/ItemRequest'));
const SharingOffer = lazy(() => import('./components/Community/SharingOffer'));
const JobPosting = lazy(() => import('./components/Community/JobPosting'));
const JobSeeking = lazy(() => import('./components/Community/JobSeeking'));
const MusicTeamRecruit = lazy(() => import('./components/Community/MusicTeamRecruit'));
const MusicTeamSeeking = lazy(() => import('./components/Community/MusicTeamSeeking'));
const ChurchEvents = lazy(() => import('./components/Community/ChurchEvents'));
const ChurchEventsDetail = lazy(() => import('./components/Community/ChurchEventsDetail'));
const MusicTeamSeekingDetail = lazy(() => import('./components/Community/MusicTeamSeekingDetail'));
const MyPosts = lazy(() => import('./components/Community/MyPosts'));
const CommunityAdmin = lazy(() => import('./components/Community/CommunityAdmin'));

// AI Tools
const AITools = lazy(() => import('./components/AITools'));
const SermonWriter = lazy(() => import('./components/ai-tools/SermonWriter'));
const PrayerGenerator = lazy(() => import('./components/ai-tools/PrayerGenerator'));
const AnnouncementWriter = lazy(() => import('./components/ai-tools/AnnouncementWriter'));
const BulletinContent = lazy(() => import('./components/ai-tools/BulletinContent'));

// Community Signup - New Version with Password & Terms
const CommunitySignupNew = lazy(() => import('./components/CommunitySignupNew'));

// Terms and Privacy
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));

// Community Application Management  
const CommunityApplicationManagement = lazy(() => import('./components/CommunityApplicationManagement'));

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
        {/* Community Signup - New Enhanced Version */}
        <Route path="/community-signup" element={
          <Suspense fallback={<LoadingSpinner />}>
            <CommunitySignupNew />
          </Suspense>
        } />
        
        {/* Terms and Privacy Pages */}
        <Route path="/terms" element={
          <Suspense fallback={<LoadingSpinner />}>
            <TermsOfService />
          </Suspense>
        } />
        <Route path="/privacy" element={
          <Suspense fallback={<LoadingSpinner />}>
            <PrivacyPolicy />
          </Suspense>
        } />
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
          <Route path="system-announcements" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SystemAnnouncementManagement />
            </Suspense>
          } />
          <Route path="announcements" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AnnouncementManagement />
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
          <Route path="security-logs" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SecurityLogs />
            </Suspense>
          } />
          
          {/* Community Routes */}
          <Route path="community" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CommunityHome />
            </Suspense>
          } />
          <Route path="community/free-sharing" element={
            <Suspense fallback={<LoadingSpinner />}>
              <FreeSharing />
            </Suspense>
          } />
          <Route path="community/free-sharing/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateSharing />
            </Suspense>
          } />
          <Route path="community/free-sharing/:id" element={
            <Suspense fallback={<LoadingSpinner />}>
              <FreeSharingDetail />
            </Suspense>
          } />
          <Route path="community/item-request" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ItemRequest />
            </Suspense>
          } />
          <Route path="community/item-request/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateItemRequest />
            </Suspense>
          } />
          <Route path="community/item-sale" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SharingOffer />
            </Suspense>
          } />
          <Route path="community/item-sale/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateSharingOffer />
            </Suspense>
          } />
          <Route path="community/job-posting" element={
            <Suspense fallback={<LoadingSpinner />}>
              <JobPosting />
            </Suspense>
          } />
          <Route path="community/job-posting/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateJobPosting />
            </Suspense>
          } />
          <Route path="community/job-seeking" element={
            <Suspense fallback={<LoadingSpinner />}>
              <JobSeeking />
            </Suspense>
          } />
          <Route path="community/job-seeking/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateJobSeeking />
            </Suspense>
          } />
          <Route path="community/music-team-recruit" element={
            <Suspense fallback={<LoadingSpinner />}>
              <MusicTeamRecruit />
            </Suspense>
          } />
          <Route path="community/music-team-recruit/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateMusicTeamRecruit />
            </Suspense>
          } />
          <Route path="community/music-team-seeking" element={
            <Suspense fallback={<LoadingSpinner />}>
              <MusicTeamSeeking />
            </Suspense>
          } />
          <Route path="community/music-team-seeking/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateMusicTeamSeeking />
            </Suspense>
          } />
          <Route path="community/church-events" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ChurchEvents />
            </Suspense>
          } />
          <Route path="community/church-events/create" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CreateChurchEvents />
            </Suspense>
          } />
          <Route path="community/church-events/:id" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ChurchEventsDetail />
            </Suspense>
          } />
          <Route path="community/music-team-seeking/:id" element={
            <Suspense fallback={<LoadingSpinner />}>
              <MusicTeamSeekingDetail />
            </Suspense>
          } />
          <Route path="community/my-posts" element={
            <Suspense fallback={<LoadingSpinner />}>
              <MyPosts />
            </Suspense>
          } />
          <Route path="community/admin" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CommunityAdmin />
            </Suspense>
          } />
          <Route path="community-applications" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CommunityApplicationManagement />
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
