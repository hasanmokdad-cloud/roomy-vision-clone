import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ChatbotBubble } from "./components/ChatbotBubble";
import ErrorBoundary from "./components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import BottomNav from "./components/BottomNav";
import MobileNavbar from "./components/MobileNavbar";
import { MobileSwipeLayout } from "./layouts/MobileSwipeLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BottomNavProvider } from "@/contexts/BottomNavContext";

// Lazy load route components
const Main = lazy(() => import("./pages/Main"));
const Auth = lazy(() => import("./pages/Auth"));
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
const DormRooms = lazy(() => import("./pages/owner/DormRooms"));
const RoomForm = lazy(() => import("./pages/owner/RoomForm"));
const BulkImport = lazy(() => import("./pages/owner/BulkImport"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const StudentMatch = lazy(() => import("./pages/StudentMatch"));
const BoostProfile = lazy(() => import("./pages/BoostProfile"));
const BulkRoomOps = lazy(() => import("./pages/owner/BulkRoomOps"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminDorms = lazy(() => import("./pages/admin/AdminDorms"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const ReviewManagement = lazy(() => import("./pages/owner/ReviewManagement"));
const AdminDormOwnership = lazy(() => import("./pages/admin/AdminDormOwnership"));
const AdminDormClaims = lazy(() => import("./pages/admin/AdminDormClaims"));
const AdminOwners = lazy(() => import("./pages/admin/AdminOwners"));
const AdminSystemMonitor = lazy(() => import("./pages/admin/AdminSystemMonitor"));
const OwnerCalendar = lazy(() => import("./pages/owner/OwnerCalendar"));
const RoommateProfile = lazy(() => import("./pages/RoommateProfile"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const SharedCollection = lazy(() => import("./pages/SharedCollection"));
const AdminPendingReview = lazy(() => import("./pages/admin/AdminPendingReview"));
const AdminRLSDebugger = lazy(() => import("./pages/admin/AdminRLSDebugger"));
const AdminMessagesInbox = lazy(() => import("./pages/admin/AdminMessagesInbox"));
const AdminDormRooms = lazy(() => import("./pages/admin/AdminDormRooms"));
const StudentTours = lazy(() => import("./pages/StudentTours"));

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
  const { loading, role } = useRoleGuard(requiredRole);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
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

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();

  return (
    <>
      <MobileNavbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<ProtectedRoute element={<Main />} forbiddenRoles={["owner"]} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/listings" element={<ProtectedRoute element={<MobileSwipeLayout><Listings /></MobileSwipeLayout>} forbiddenRoles={["owner"]} />} />
          <Route path="/dorm/:id" element={<DormDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/shared/:shareCode" element={<SharedCollection />} />
          <Route 
            path="/select-role" 
            element={
              <ProtectedRoute element={<RoleSelection />} allowedRoles={["none"]} />
            } 
          />

          <Route path="/my-tours" element={<ProtectedRoute element={<StudentTours />} forbiddenRoles={["owner"]} />} />
          <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
          <Route path="/saved-dorms" element={<ProtectedRoute element={<SavedDorms />} />} />
          <Route path="/saved-rooms" element={<ProtectedRoute element={<SavedRooms />} />} />
          <Route path="/messages" element={<ProtectedRoute element={<Messages />} />} />
          <Route path="/student-profile/:id" element={<ProtectedRoute element={<StudentProfile />} />} />
          <Route path="/roommate/:userId" element={<ProtectedRoute element={<RoommateProfile />} />} />
          <Route path="/ai-match" element={<ProtectedRoute element={<MobileSwipeLayout><AiMatch /></MobileSwipeLayout>} forbiddenRoles={["owner"]} />} />
          <Route path="/ai-roommate-match" element={<ProtectedRoute element={<StudentMatch />} />} />
          <Route path="/boost-profile" element={<ProtectedRoute element={<BoostProfile />} />} />
          <Route path="/ai-chat" element={<ProtectedRoute element={<MobileSwipeLayout><AiChat /></MobileSwipeLayout>} />} />

          {/* Owner Routes - Admins can access all owner routes */}
          <Route path="/owner" element={<ProtectedRoute element={<OwnerHome />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/listings" element={<ProtectedRoute element={<OwnerListings />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/new" element={<ProtectedRoute element={<AddNewDorm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/:dormId/rooms" element={<ProtectedRoute element={<DormRooms />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/:dormId/rooms/new" element={<ProtectedRoute element={<RoomForm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/:dormId/rooms/:roomId/edit" element={<ProtectedRoute element={<RoomForm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bulk-import" element={<ProtectedRoute element={<BulkImport />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/performance" element={<ProtectedRoute element={<OwnerPerformance />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/rooms" element={<ProtectedRoute element={<OwnerRooms />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bookings" element={<ProtectedRoute element={<OwnerBookings />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bulk-operations" element={<ProtectedRoute element={<BulkRoomOps />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/reviews" element={<ProtectedRoute element={<ReviewManagement />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/calendar" element={<ProtectedRoute element={<OwnerCalendar />} allowedRoles={["owner", "admin"]} />} />

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
          <Route path="/admin/ownership" element={<ProtectedRoute element={<AdminDormOwnership />} requiredRole="admin" />} />
          <Route path="/admin/owners" element={<ProtectedRoute element={<AdminOwners />} requiredRole="admin" />} />
          <Route path="/admin/claims" element={<ProtectedRoute element={<AdminDormClaims />} requiredRole="admin" />} />
          <Route path="/admin/logs" element={<ProtectedRoute element={<AdminLogs />} requiredRole="admin" />} />
          <Route path="/admin/notifications" element={<ProtectedRoute element={<AdminNotifications />} requiredRole="admin" />} />
          <Route path="/admin/settings" element={<ProtectedRoute element={<AdminSettings />} requiredRole="admin" />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {!location.pathname.match(/^\/(auth|intro|select-role)$/) && (
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
          <BottomNavProvider>
            <div className="w-full max-w-screen overflow-x-hidden">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </div>
          </BottomNavProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
