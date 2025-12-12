import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ChatbotBubble } from "./components/ChatbotBubble";
import ErrorBoundary from "./components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import BottomNav from "./components/BottomNav";
import MobileNavbar from "./components/MobileNavbar";
import { MobileSwipeLayout } from "./layouts/MobileSwipeLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BottomNavProvider } from "@/contexts/BottomNavContext";
import { MicPermissionProvider } from "@/contexts/MicPermissionContext";
import { supabase } from "@/integrations/supabase/client";

// Lazy load route components
const Auth = lazy(() => import("./pages/Auth"));
const CheckEmail = lazy(() => import("./pages/auth/CheckEmail"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ResetPasswordSuccess = lazy(() => import("./pages/auth/ResetPasswordSuccess"));
const ResetPasswordError = lazy(() => import("./pages/auth/ResetPasswordError"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const Intro = lazy(() => import("./pages/Intro"));
const Profile = lazy(() => import("./pages/Profile"));
const DormDetail = lazy(() => import("./pages/DormDetail"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Trends = lazy(() => import("./pages/admin/Trends"));
const OwnerHome = lazy(() => import("./pages/owner/OwnerHome"));
const OwnerPerformance = lazy(() => import("./pages/owner/Performance"));
const Listings = lazy(() => import("./pages/Listings"));
const AiMatch = lazy(() => import("./pages/AiMatch"));
const AiChat = lazy(() => import("./pages/AiChat"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Settings = lazy(() => import("./pages/Settings"));
const Messages = lazy(() => import("./pages/Messages"));
const SavedDorms = lazy(() => import("./pages/SavedDorms"));
const SavedRooms = lazy(() => import("./pages/SavedRooms"));
const OwnerAddDorm = lazy(() => import("./pages/owner/OwnerAddDorm"));
const AddNewDorm = lazy(() => import("./pages/owner/AddNewDorm"));
const OwnerRooms = lazy(() => import("./pages/owner/OwnerRooms"));
const OwnerBookings = lazy(() => import("./pages/owner/OwnerBookings"));
const OwnerListings = lazy(() => import("./pages/owner/OwnerListings"));

const RoomForm = lazy(() => import("./pages/owner/RoomForm"));
const BulkImport = lazy(() => import("./pages/owner/BulkImport"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const StudentMatch = lazy(() => import("./pages/StudentMatch"));
const ReservationConfirmation = lazy(() => import("./pages/ReservationConfirmation"));
const ReservationSuccess = lazy(() => import("./pages/ReservationSuccess"));
const ReservationFailed = lazy(() => import("./pages/ReservationFailed"));
const BoostProfile = lazy(() => import("./pages/BoostProfile"));
const OwnerEarnings = lazy(() => import("./pages/owner/OwnerEarnings"));
const BulkRoomOps = lazy(() => import("./pages/owner/BulkRoomOps"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminDorms = lazy(() => import("./pages/admin/AdminDorms"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));

const ReviewManagement = lazy(() => import("./pages/owner/ReviewManagement"));


const AdminOwners = lazy(() => import("./pages/admin/AdminOwners"));
const AdminSystemMonitor = lazy(() => import("./pages/admin/AdminSystemMonitor"));
const AdminSecurityMonitor = lazy(() => import("./pages/admin/AdminSecurityMonitor"));
const OwnerCalendar = lazy(() => import("./pages/owner/OwnerCalendar"));
const RoommateProfile = lazy(() => import("./pages/RoommateProfile"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const SharedCollection = lazy(() => import("./pages/SharedCollection"));
const AdminPendingReview = lazy(() => import("./pages/admin/AdminPendingReview"));
const AdminRLSDebugger = lazy(() => import("./pages/admin/AdminRLSDebugger"));
const AdminMessagesInbox = lazy(() => import("./pages/admin/AdminMessagesInbox"));
const AdminDormRooms = lazy(() => import("./pages/admin/AdminDormRooms"));
const StudentTours = lazy(() => import("./pages/StudentTours"));
const AdminChats = lazy(() => import("./pages/admin/AdminChats"));
const AdminChatView = lazy(() => import("./pages/admin/AdminChatView"));
const AdminChatAnalytics = lazy(() => import("./pages/admin/AdminChatAnalytics"));
const AdminAiMatchLogs = lazy(() => import("./pages/admin/AdminAiMatchLogs"));
const AdminAiDebug = lazy(() => import("./pages/admin/AdminAiDebug"));
const PersonalityTest = lazy(() => import("./pages/PersonalityTest"));
const CompatibilityTest = lazy(() => import("./pages/CompatibilityTest"));
const AdminPersonalityInsights = lazy(() => import("./pages/admin/AdminPersonalityInsights"));
const AdminAiDiagnostics = lazy(() => import("./pages/admin/AdminAiDiagnostics"));
const StudentPayments = lazy(() => import("./pages/student/StudentPayments"));
const AdminPaymentsDashboard = lazy(() => import("./pages/admin/AdminPaymentsDashboard"));
const OwnerRefundRequests = lazy(() => import("./pages/owner/OwnerRefundRequests"));
const Legal = lazy(() => import("./pages/Legal"));
const MockWhishCheckout = lazy(() => import("./pages/MockWhishCheckout"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const Wallet = lazy(() => import("./pages/Wallet"));
const BillingHistory = lazy(() => import("./pages/BillingHistory"));
const MockWhishAddCard = lazy(() => import("./pages/MockWhishAddCard"));
const OwnerWallet = lazy(() => import("./pages/owner/OwnerWallet"));
const MockWhishOwnerAddCard = lazy(() => import("./pages/owner/MockWhishOwnerAddCard"));
const OwnerStats = lazy(() => import("./pages/owner/OwnerStats"));

const AdminWallet = lazy(() => import("./pages/admin/AdminWallet"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const MockWhishAdminAddCard = lazy(() => import("./pages/admin/MockWhishAdminAddCard"));
const AdminRefunds = lazy(() => import("./pages/admin/AdminRefunds"));
const AdminEarnings = lazy(() => import("./pages/admin/AdminEarnings"));
const VerifyDevice = lazy(() => import("./pages/devices/VerifyDevice"));
const SecureAccount = lazy(() => import("./pages/devices/SecureAccount"));
const DevicesPage = lazy(() => import("./pages/settings/DevicesPage"));
const DevicePending = lazy(() => import("./pages/auth/DevicePending"));
const ApproveDevice = lazy(() => import("./pages/auth/ApproveDevice"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const AccountSuspended = lazy(() => import("./pages/AccountSuspended"));
const BecomeOwner = lazy(() => import("./pages/BecomeOwner"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-8 w-1/2 mx-auto" />
    </div>
  </div>
);

// Protected route component for authenticated routes
function ProtectedRoute({
  element,
  requiredRole,
  allowedRoles,
  forbiddenRoles,
}: {
  element: JSX.Element;
  requiredRole?: "admin" | "owner" | "student";
  allowedRoles?: ("admin" | "owner" | "student" | "none")[];
  forbiddenRoles?: ("admin" | "owner" | "student")[];
}) {
  const location = useLocation();
  const { loading, role, isAuthenticated } = useRoleGuard(requiredRole);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!isAuthenticated) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Admin must NEVER see /select-role
  if (role === "admin" && location.pathname === "/select-role") {
    return <Navigate to="/admin" replace />;
  }

  // Prevent users with existing roles from re-accessing /select-role
  if (location.pathname === "/select-role" && role) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "owner") return <Navigate to="/owner" replace />;
    if (role === "student") return <Navigate to="/listings" replace />;
  }

  // Handle "none" role (users with no assigned role)
  if (allowedRoles?.includes("none") && !role) {
    return element;
  }

  // Check if role is forbidden for this route
  if (forbiddenRoles && role && forbiddenRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If allowedRoles is provided, check if current role is in the list
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If user has NO role → send them to role selection (unless they're admin)
  if (!role && requiredRole !== "admin") {
    return <Navigate to="/select-role" replace />;
  }

  // Role mismatch → unauthorized (only if allowedRoles not specified)
  if (!allowedRoles && requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return element;
}

// Component to handle first visit intro redirect
function IntroRedirect() {
  const introPlayed = sessionStorage.getItem("intro-played");
  
  if (!introPlayed) {
    return <Navigate to="/intro" replace />;
  }
  
  return <Navigate to="/listings" replace />;
}

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();

  return (
    <>
      <MobileNavbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root redirect - check if intro was played */}
          <Route path="/" element={<IntroRedirect />} />
          
          {/* Public Routes - No auth required */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/check-email" element={<CheckEmail />} />
          <Route path="/auth/verify" element={<VerifyEmail />} />
          <Route path="/auth/reset" element={<ResetPassword />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/password-reset/success" element={<ResetPasswordSuccess />} />
          <Route path="/password-reset/error" element={<ResetPasswordError />} />
          <Route path="/auth/device-pending" element={<DevicePending />} />
          <Route path="/auth/approve-device" element={<ApproveDevice />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/devices/verify" element={<VerifyDevice />} />
          <Route path="/devices/secure" element={<SecureAccount />} />
          <Route path="/account-suspended" element={<AccountSuspended />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/shared/:shareCode" element={<SharedCollection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal/:page" element={<Legal />} />
          
          {/* PUBLIC - Listings and Dorm Details (no auth required) */}
          <Route path="/listings" element={<MobileSwipeLayout><Listings /></MobileSwipeLayout>} />
          <Route path="/dorm/:id" element={<DormDetail />} />
          
          {/* Become Owner - requires auth but accessible to students */}
          <Route path="/become-owner" element={<BecomeOwner />} />
          
          {/* Role Selection - for users with no role */}
          <Route 
            path="/select-role" 
            element={
              <ProtectedRoute element={<RoleSelection />} allowedRoles={["none"]} />
            } 
          />

          {/* Protected Routes - Requires authentication */}
          <Route path="/my-tours" element={<ProtectedRoute element={<StudentTours />} forbiddenRoles={["owner"]} />} />
          <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
          <Route path="/settings/devices" element={<ProtectedRoute element={<DevicesPage />} />} />
          <Route path="/saved-dorms" element={<ProtectedRoute element={<SavedDorms />} />} />
          <Route path="/saved-rooms" element={<ProtectedRoute element={<SavedRooms />} />} />
          <Route path="/messages" element={<ProtectedRoute element={<Messages />} />} />
          <Route path="/student-profile/:id" element={<ProtectedRoute element={<StudentProfile />} />} />
          <Route path="/roommate/:userId" element={<ProtectedRoute element={<RoommateProfile />} />} />
          <Route path="/ai-match" element={<ProtectedRoute element={<MobileSwipeLayout><AiMatch /></MobileSwipeLayout>} forbiddenRoles={["owner"]} />} />
          <Route path="/ai-roommate-match" element={<ProtectedRoute element={<StudentMatch />} />} />
          <Route path="/boost-profile" element={<ProtectedRoute element={<BoostProfile />} />} />
          <Route path="/personality" element={<ProtectedRoute element={<PersonalityTest />} requiredRole="student" />} />
          <Route path="/compatibility-test" element={<ProtectedRoute element={<CompatibilityTest />} requiredRole="student" />} />
          <Route path="/ai-chat" element={<ProtectedRoute element={<MobileSwipeLayout><AiChat /></MobileSwipeLayout>} />} />
          <Route path="/reservation/confirmation" element={<ProtectedRoute element={<ReservationConfirmation />} requiredRole="student" />} />
          <Route path="/reservation/success" element={<ProtectedRoute element={<ReservationSuccess />} requiredRole="student" />} />
          <Route path="/reservation/failed" element={<ProtectedRoute element={<ReservationFailed />} requiredRole="student" />} />
          <Route path="/student/payments" element={<ProtectedRoute element={<StudentPayments />} requiredRole="student" />} />
          
          {/* Payment Flow Pages */}
          <Route path="/mock-whish-checkout" element={<ProtectedRoute element={<MockWhishCheckout />} requiredRole="student" />} />
          <Route path="/payment/callback" element={<ProtectedRoute element={<PaymentCallback />} requiredRole="student" />} />
          <Route path="/wallet" element={<ProtectedRoute element={<Wallet />} requiredRole="student" />} />
          <Route path="/billing-history" element={<ProtectedRoute element={<BillingHistory />} requiredRole="student" />} />
          <Route path="/mock-whish-add-card" element={<ProtectedRoute element={<MockWhishAddCard />} requiredRole="student" />} />

          {/* Owner Routes - Admins can access all owner routes */}
          <Route path="/owner" element={<ProtectedRoute element={<OwnerHome />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/listings" element={<ProtectedRoute element={<OwnerListings />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/add-dorm" element={<ProtectedRoute element={<OwnerAddDorm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/new" element={<Navigate to="/owner/add-dorm" replace />} />
          
          <Route path="/owner/dorms/:dormId/rooms/new" element={<ProtectedRoute element={<RoomForm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/:dormId/rooms/:roomId/edit" element={<ProtectedRoute element={<RoomForm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bulk-import" element={<ProtectedRoute element={<BulkImport />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/performance" element={<ProtectedRoute element={<OwnerPerformance />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/rooms" element={<ProtectedRoute element={<OwnerRooms />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bookings" element={<ProtectedRoute element={<OwnerBookings />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bulk-operations" element={<ProtectedRoute element={<BulkRoomOps />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/reviews" element={<ProtectedRoute element={<ReviewManagement />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/calendar" element={<ProtectedRoute element={<OwnerCalendar />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/earnings" element={<ProtectedRoute element={<OwnerEarnings />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/refunds" element={<ProtectedRoute element={<OwnerRefundRequests />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/wallet" element={<ProtectedRoute element={<OwnerWallet />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/stats" element={<ProtectedRoute element={<OwnerStats />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/mock-whish-owner-add-card" element={<ProtectedRoute element={<MockWhishOwnerAddCard />} allowedRoles={["owner", "admin"]} />} />


          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />} />
          <Route path="/admin/messages" element={<ProtectedRoute element={<AdminMessagesInbox />} requiredRole="admin" />} />
          <Route path="/admin/rls-debugger" element={<ProtectedRoute element={<AdminRLSDebugger />} requiredRole="admin" />} />
          <Route path="/admin/pending-review" element={<ProtectedRoute element={<AdminPendingReview />} requiredRole="admin" />} />
          <Route path="/admin/analytics" element={<ProtectedRoute element={<Analytics />} requiredRole="admin" />} />
          <Route path="/admin/trends" element={<ProtectedRoute element={<Trends />} requiredRole="admin" />} />
          <Route path="/admin/students" element={<ProtectedRoute element={<AdminStudents />} requiredRole="admin" />} />
          <Route path="/admin/dorms" element={<ProtectedRoute element={<AdminDorms />} requiredRole="admin" />} />
          <Route path="/admin/dorms/:dormId/rooms" element={<ProtectedRoute element={<AdminDormRooms />} requiredRole="admin" />} />
          <Route path="/admin/owners" element={<ProtectedRoute element={<AdminOwners />} requiredRole="admin" />} />
          <Route path="/admin/personality-insights" element={<ProtectedRoute element={<AdminPersonalityInsights />} requiredRole="admin" />} />
          
          <Route path="/admin/logs" element={<ProtectedRoute element={<AdminLogs />} requiredRole="admin" />} />
          <Route path="/admin/ai-match-logs" element={<ProtectedRoute element={<AdminAiMatchLogs />} requiredRole="admin" />} />
          <Route path="/admin/ai-debug" element={<ProtectedRoute element={<AdminAiDebug />} requiredRole="admin" />} />
          <Route path="/admin/ai-diagnostics" element={<ProtectedRoute element={<AdminAiDiagnostics />} requiredRole="admin" />} />
          <Route path="/admin/payments" element={<ProtectedRoute element={<AdminPaymentsDashboard />} requiredRole="admin" />} />
          <Route path="/admin/notifications" element={<ProtectedRoute element={<AdminNotifications />} requiredRole="admin" />} />
          <Route path="/admin/system-monitor" element={<ProtectedRoute element={<AdminSystemMonitor />} requiredRole="admin" />} />
          <Route path="/admin/security" element={<ProtectedRoute element={<AdminSecurityMonitor />} requiredRole="admin" />} />
          <Route path="/admin/wallet" element={<ProtectedRoute element={<AdminWallet />} requiredRole="admin" />} />
          <Route path="/admin/billing" element={<ProtectedRoute element={<AdminBilling />} requiredRole="admin" />} />
          <Route path="/mock-whish-admin-add-card" element={<ProtectedRoute element={<MockWhishAdminAddCard />} requiredRole="admin" />} />
          <Route path="/admin/refunds" element={<ProtectedRoute element={<AdminRefunds />} requiredRole="admin" />} />
          <Route path="/admin/earnings" element={<ProtectedRoute element={<AdminEarnings />} requiredRole="admin" />} />
          <Route path="/admin/chats" element={<ProtectedRoute element={<AdminChats />} requiredRole="admin" />} />
          <Route path="/admin/chats/:conversationId" element={<ProtectedRoute element={<AdminChatView />} requiredRole="admin" />} />
            <Route path="/admin/chats/analytics" element={<ProtectedRoute element={<AdminChatAnalytics />} requiredRole="admin" />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {!location.pathname.match(/^\/(auth|intro|select-role|become-owner)$/) && (
        <>
          <BottomNav />
          <ChatbotBubble />
        </>
      )}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <MicPermissionProvider>
            <BottomNavProvider>
              <div className="w-full max-w-screen overflow-x-hidden">
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </div>
            </BottomNavProvider>
          </MicPermissionProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
