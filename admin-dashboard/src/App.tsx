import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import SermonLibrary from './components/SermonLibrary';
import SupabaseTest from './components/SupabaseTest';
import { ToastProvider } from './contexts/ToastContext';
import { SpinnerProvider } from './contexts/SpinnerContext';
import { Toaster } from './components/ui';
import { Spinner, LoadingState } from './components/ui/spinner';
import { Card } from './components/ui/card';
import { PageContainer } from './components/ui/PageContainer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// React Query 클라이언트 — 화면 간 공유 데이터 캐시
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,           // 1분 동안 신선
      gcTime: 5 * 60_000,          // 5분간 캐시 보관
      refetchOnWindowFocus: false, // 포커스 시 자동 재요청 끔(과도한 호출 방지)
      retry: 1,
    },
  },
});

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Members = lazy(() => import('./components/Members'));
const MemberManagement = lazy(() => import('./components/MemberManagement'));
const SystemAnnouncementManagement = lazy(() => import('./components/SystemAnnouncementManagement'));
const SystemAnnouncementList = lazy(() => import('./components/SystemAnnouncementList'));
const AnnouncementManagement = lazy(() => import('./components/AnnouncementManagement'));
const SMSManagement = lazy(() => import('./components/SMSManagement'));
const QRCodeManagement = lazy(() => import('./components/QRCodeManagement'));
const ExcelManagement = lazy(() => import('./components/ExcelManagement'));
const Attendance = lazy(() => import('./components/Attendance'));
const Bulletins = lazy(() => import('./components/Bulletins'));
const ChurchInfo = lazy(() => import('./components/ChurchInfo'));
const DailyVerse = lazy(() => import('./components/DailyVerse'));
const WorshipScheduleManagement = lazy(() => import('./components/worship/WorshipScheduleManagement'));
const PushNotifications = lazy(() => import('./components/PushNotifications'));
const MessageSending = lazy(() => import('./components/MessageSending'));
const AIChat = lazy(() => import('./components/AIChat'));
const AIAgentManagement = lazy(() => import('./components/AIAgentManagement'));
const ChurchSettings = lazy(() => import('./components/ChurchSettings'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const PastoralCareManagement = lazy(() => import('./components/PastoralCareManagement'));
const PrayerRequests = lazy(() => import('./components/PrayerRequests'));
const DonationManagement = lazy(() => import('./components/DonationManagement'));
const BulkDonationInput = lazy(() => import('./components/BulkDonationInput'));
const AccountingManagement = lazy(() => import('./components/AccountingManagement'));
const AccountCategoryManagement = lazy(() => import('./components/AccountCategoryManagement'));
const BudgetManagement = lazy(() => import('./components/BudgetManagement'));
const SettlementManagement = lazy(() => import('./components/SettlementManagement'));
const ImportantDatesManagement = lazy(() => import('./components/ImportantDatesManagement'));
// const OfferingsManagement = lazy(() => import('./components/OfferingsManagement'));
const AddMemberWizard = lazy(() => import('./components/AddMemberWizard'));
const OrganizationManagement = lazy(() => import('./components/OrganizationManagement'));
const GPTSettings = lazy(() => import('./pages/GPTSettings'));
const SecurityLogs = lazy(() => import('./components/SecurityLogs'));

// Community Components
const CommunityHome = lazy(() => import('./components/Community/CommunityHome'));
const FreeSharing = lazy(() => import('./components/Community/FreeSharing'));
const CreateSharing = lazy(() => import('./components/Community/CreateSharing'));
const FreeSharingDetail = lazy(() => import('./components/Community/FreeSharingDetail'));
const CreateItemRequest = lazy(() => import('./components/Community/CreateItemRequest'));
const ItemRequestDetail = lazy(() => import('./components/Community/ItemRequestDetail'));
const CreateSharingOffer = lazy(() => import('./components/Community/CreateSharingOffer'));
const SharingOfferDetail = lazy(() => import('./components/Community/SharingOfferDetail'));
const CreateCommunityPost = lazy(() => import('./components/Community/CreateCommunityPost'));
const CreateJobPosting = lazy(() => import('./components/Community/CreateJobPosting'));
const CreateJobSeeking = lazy(() => import('./components/Community/CreateJobSeeking'));
const CreateMusicTeamRecruit = lazy(() => import('./components/Community/CreateMusicTeamRecruit'));
const CreateMusicTeamSeeking = lazy(() => import('./components/Community/CreateMusicTeamSeeking'));
const CreateChurchEvents = lazy(() => import('./components/Community/CreateChurchEvents'));
const ChurchNews = lazy(() => import('./components/Community/ChurchNews'));
const CreateChurchNews = lazy(() => import('./components/Community/CreateChurchNews'));
const EditChurchNews = lazy(() => import('./components/Community/EditChurchNews'));
const ItemRequest = lazy(() => import('./components/Community/ItemRequest'));
const SharingOffer = lazy(() => import('./components/Community/SharingOffer'));
const JobPosting = lazy(() => import('./components/Community/JobPosting'));
const JobPostingDetail = lazy(() => import('./components/Community/JobPostingDetail'));
const JobSeeking = lazy(() => import('./components/Community/JobSeeking'));
const MusicTeamRecruit = lazy(() => import('./components/Community/MusicTeamRecruit'));
const MusicTeamSeeking = lazy(() => import('./components/Community/MusicTeamSeeking'));
const ChurchEvents = lazy(() => import('./components/Community/ChurchEvents'));
const ChurchEventsDetail = lazy(() => import('./components/Community/ChurchEventsDetail'));
const MusicTeamSeekingDetail = lazy(() => import('./components/Community/MusicTeamSeekingDetail'));
const MusicTeamRecruitDetail = lazy(() => import('./components/Community/MusicTeamRecruitDetail'));
const MyPosts = lazy(() => import('./components/Community/MyPosts'));
const Wishlists = lazy(() => import('./components/Community/Wishlists'));
const CommunityAdmin = lazy(() => import('./components/Community/CommunityAdmin'));

// AI Tools
const AITools = lazy(() => import('./components/AITools'));
const SermonWriter = lazy(() => import('./components/ai-tools/SermonWriter'));
const PrayerGenerator = lazy(() => import('./components/ai-tools/PrayerGenerator'));
const AnnouncementWriter = lazy(() => import('./components/ai-tools/AnnouncementWriter'));
const BulletinContent = lazy(() => import('./components/ai-tools/BulletinContent'));

// Community Signup - New Version with Password & Terms
const CommunitySignupNew = lazy(() => import('./components/CommunitySignupNew'));

// Church Signup
const ChurchSignup = lazy(() => import('./components/ChurchSignup'));

// Terms and Privacy
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));

// Community Application Management
const CommunityApplicationManagement = lazy(() => import('./components/CommunityApplicationManagement'));

// Church Application Management
const ChurchApplicationManagement = lazy(() => import('./components/ChurchApplicationManagement'));

// Admin Role Management
const AdminRoleManagement = lazy(() => import('./components/AdminRoleManagement'));

// Permission Group Management
const PermissionGroupManagement = lazy(() => import('./components/PermissionGroupManagement'));

// Church Management
const ChurchManagement = lazy(() => import('./components/ChurchManagement'));
const GptLicenseManagement = lazy(() => import('./components/GptLicenseManagement'));
const ChurchGptLicenseAssignment = lazy(() => import('./components/ChurchGptLicenseAssignment'));

// Landing Page
const LandingPage = lazy(() => import('./components/Landing/LandingPage'));

// Download Redirect Page
const DownloadRedirect = lazy(() => import('./pages/DownloadRedirect'));

// Sermon Management
const SermonManagement = lazy(() => import('./components/SermonManagement'));

// Member Pages
const AddMemberPage = lazy(() => import('./pages/AddMemberPage'));
const EditMemberPage = lazy(() => import('./pages/EditMemberPage'));

// 인증/랜딩 등 풀스크린 영역용 (Layout 바깥)
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

// Layout 안쪽 본문에서 라우트 chunk를 기다리는 동안 사용 — 페이지 내 데이터 로딩과 동일한 비주얼
const PageLoadingFallback = () => (
  <PageContainer>
    <Card>
      <LoadingState text="불러오는 중..." />
    </Card>
  </PageContainer>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <SpinnerProvider>
        <Router>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/supabase-test" element={<SupabaseTest />} />

        {/* Landing Page */}
        <Route path="/landing" element={
          <Suspense fallback={<LoadingSpinner />}>
            <LandingPage />
          </Suspense>
        } />

        {/* Download Redirect - Universal App Download Link */}
        <Route path="/download" element={
          <Suspense fallback={<LoadingSpinner />}>
            <DownloadRedirect />
          </Suspense>
        } />

        {/* Community Signup - New Enhanced Version */}
        <Route path="/community-signup" element={
          <Suspense fallback={<LoadingSpinner />}>
            <CommunitySignupNew />
          </Suspense>
        } />
        {/* Church Signup */}
        <Route path="/church-signup" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ChurchSignup />
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
            <Suspense fallback={<PageLoadingFallback />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="members" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <Members />
            </Suspense>
          } />
          <Route path="member-management" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <MemberManagement />
            </Suspense>
          } />
          <Route path="member-management/add" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AddMemberPage />
            </Suspense>
          } />
          <Route path="member-management/edit/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <EditMemberPage />
            </Suspense>
          } />
          <Route path="organization-management" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <OrganizationManagement />
            </Suspense>
          } />
          <Route path="add-member" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AddMemberWizard />
            </Suspense>
          } />
          <Route path="donations" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <DonationManagement />
            </Suspense>
          } />
          <Route path="donations/bulk-input" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <BulkDonationInput />
            </Suspense>
          } />
          <Route path="accounting" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AccountingManagement />
            </Suspense>
          } />
          <Route path="account-categories" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AccountCategoryManagement />
            </Suspense>
          } />
          <Route path="budget" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <BudgetManagement />
            </Suspense>
          } />
          <Route path="settlement" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SettlementManagement />
            </Suspense>
          } />
          <Route path="system-announcements" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SystemAnnouncementManagement />
            </Suspense>
          } />
          <Route path="system-announcements-list" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SystemAnnouncementList />
            </Suspense>
          } />
          <Route path="announcements" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AnnouncementManagement />
            </Suspense>
          } />
          <Route path="sermons" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SermonManagement />
            </Suspense>
          } />
          <Route path="ai-chat" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AIChat />
            </Suspense>
          } />
          <Route path="ai-agent-management" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AIAgentManagement />
            </Suspense>
          } />
          <Route path="sermon-library" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SermonLibrary />
            </Suspense>
          } />
          <Route path="church-settings" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ChurchSettings />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AnalyticsDashboard />
            </Suspense>
          } />
          <Route path="pastoral-care" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PastoralCareManagement />
            </Suspense>
          } />
          <Route path="important-dates" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ImportantDatesManagement />
            </Suspense>
          } />
          <Route path="prayer-requests" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PrayerRequests />
            </Suspense>
          } />
          <Route path="sms" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SMSManagement />
            </Suspense>
          } />
          <Route path="qr-codes" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <QRCodeManagement />
            </Suspense>
          } />
          <Route path="statistics" element={<Navigate to="/dashboard" replace />} />
          <Route path="excel" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ExcelManagement />
            </Suspense>
          } />
          <Route path="attendance" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <Attendance />
            </Suspense>
          } />
          <Route path="bulletins" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <Bulletins />
            </Suspense>
          } />
          <Route path="daily-verses" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <DailyVerse />
            </Suspense>
          } />
          <Route path="church" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ChurchInfo />
            </Suspense>
          } />
          <Route path="worship-schedule" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <WorshipScheduleManagement />
            </Suspense>
          } />
          <Route path="push-notifications" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PushNotifications />
            </Suspense>
          } />
          <Route path="message-sending" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <MessageSending />
            </Suspense>
          } />
          <Route path="gpt-settings" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <GPTSettings />
            </Suspense>
          } />
          <Route path="security-logs" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SecurityLogs />
            </Suspense>
          } />
          
          {/* Community Routes */}
          <Route path="community" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CommunityHome />
            </Suspense>
          } />
          <Route path="community/free-sharing" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <FreeSharing />
            </Suspense>
          } />
          <Route path="community/free-sharing/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateSharing />
            </Suspense>
          } />
          <Route path="community/free-sharing/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <FreeSharingDetail />
            </Suspense>
          } />
          <Route path="community/item-request" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ItemRequest />
            </Suspense>
          } />
          <Route path="community/item-request/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateItemRequest />
            </Suspense>
          } />
          <Route path="community/item-request/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ItemRequestDetail />
            </Suspense>
          } />
          <Route path="community/item-sale" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SharingOffer />
            </Suspense>
          } />
          <Route path="community/item-sale/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateSharingOffer />
            </Suspense>
          } />
          <Route path="community/item-sale/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SharingOfferDetail />
            </Suspense>
          } />
          <Route path="community/job-posting" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <JobPosting />
            </Suspense>
          } />
          <Route path="community/job-posting/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <JobPostingDetail />
            </Suspense>
          } />
          <Route path="community/job-posting/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateJobPosting />
            </Suspense>
          } />
          <Route path="community/job-seeking" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <JobSeeking />
            </Suspense>
          } />
          <Route path="community/job-seeking/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateJobSeeking />
            </Suspense>
          } />
          <Route path="community/music-team-recruit" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <MusicTeamRecruit />
            </Suspense>
          } />
          <Route path="community/music-team-recruit/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <MusicTeamRecruitDetail />
            </Suspense>
          } />
          <Route path="community/music-team-recruit/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateMusicTeamRecruit />
            </Suspense>
          } />
          <Route path="community/music-team-seeking" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <MusicTeamSeeking />
            </Suspense>
          } />
          <Route path="community/music-team-seeking/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateMusicTeamSeeking />
            </Suspense>
          } />
          <Route path="community/church-news" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ChurchNews />
            </Suspense>
          } />
          <Route path="community/church-news/create" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CreateChurchNews />
            </Suspense>
          } />
          <Route path="community/church-news/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ChurchEventsDetail />
            </Suspense>
          } />
          <Route path="community/church-news/:id/edit" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <EditChurchNews />
            </Suspense>
          } />

          {/* Legacy route redirects - church-events → church-news */}
          <Route path="community/church-events" element={<Navigate to="/community/church-news" replace />} />
          <Route path="community/church-events/:id" element={<Navigate to="/community/church-news" replace />} />
          <Route path="community/music-team-seeking/:id" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <MusicTeamSeekingDetail />
            </Suspense>
          } />
          <Route path="community/my-posts" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <MyPosts />
            </Suspense>
          } />
          <Route path="community/wishlists" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <Wishlists />
            </Suspense>
          } />
          <Route path="community/admin" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CommunityAdmin />
            </Suspense>
          } />
          <Route path="community-applications" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <CommunityApplicationManagement />
            </Suspense>
          } />
          <Route path="church-applications" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ChurchApplicationManagement />
            </Suspense>
          } />
          <Route path="admin-roles" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AdminRoleManagement />
            </Suspense>
          } />
          <Route path="permission-groups" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PermissionGroupManagement />
            </Suspense>
          } />
          <Route path="church-management" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ChurchManagement />
            </Suspense>
          } />
          <Route path="gpt-license-management" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <GptLicenseManagement />
            </Suspense>
          } />
          <Route path="church-gpt-license-assignment" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ChurchGptLicenseAssignment />
            </Suspense>
          } />
          <Route path="ai-tools" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AITools />
            </Suspense>
          } />
          <Route path="ai-tools/sermon-writer" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <SermonWriter />
            </Suspense>
          } />
          <Route path="ai-tools/prayer-generator" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PrayerGenerator />
            </Suspense>
          } />
          <Route path="ai-tools/announcement-writer" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <AnnouncementWriter />
            </Suspense>
          } />
          <Route path="ai-tools/bulletin-content" element={
            <Suspense fallback={<PageLoadingFallback />}>
              <BulletinContent />
            </Suspense>
          } />
        </Route>
      </Routes>
        <Toaster />
        </Router>
      </SpinnerProvider>
    </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
