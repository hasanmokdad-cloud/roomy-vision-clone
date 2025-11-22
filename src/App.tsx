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

// Lazy load route components
const Main = lazy(() => import("./pages/Main"));
const Auth = lazy(() => import("./pages/Auth"));
const Intro = lazy(() => import("./pages/Intro"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DormDetail = lazy(() => import("./pages/DormDetail"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Trends = lazy(() => import("./pages/admin/Trends"));
const OwnerDashboard = lazy(() => import("./pages/owner/OwnerDashboard"));
const OwnerPerformance = lazy(() => import("./pages/owner/Performance"));
const StudentDashboard = lazy(() => import("./pages/dashboard/StudentDashboard"));
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
}: {
  element: JSX.Element;
  requiredRole?: "admin" | "owner" | "student";
  allowedRoles?: ("admin" | "owner" | "student" | "none")[];
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
    if (role === "student") return <Navigate to="/dashboard" replace />;
  }

  // Handle "none" role (users with no assigned role)
  if (allowedRoles?.includes("none") && !role) {
    return element;
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
          <Route path="/" element={<Main />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/listings" element={<MobileSwipeLayout><Listings /></MobileSwipeLayout>} />
          <Route path="/dorm/:id" element={<DormDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route 
            path="/select-role" 
            element={
              <ProtectedRoute element={<RoleSelection />} allowedRoles={["none"]} />
            } 
          />

          {/* Student Routes */}
          <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding />} requiredRole="student" />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} requiredRole="student" />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} requiredRole="student" />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings />} requiredRole="student" />} />
          <Route path="/messages" element={<ProtectedRoute element={<Messages />} requiredRole="student" />} />
          <Route path="/student-profile/:id" element={<ProtectedRoute element={<StudentProfile />} requiredRole="student" />} />
          <Route path="/ai-match" element={<ProtectedRoute element={<MobileSwipeLayout><AiMatch /></MobileSwipeLayout>} requiredRole="student" />} />
          <Route path="/ai-roommate-match" element={<ProtectedRoute element={<StudentMatch />} requiredRole="student" />} />
          <Route path="/boost-profile" element={<ProtectedRoute element={<BoostProfile />} requiredRole="student" />} />
          <Route path="/ai-chat" element={<ProtectedRoute element={<MobileSwipeLayout><AiChat /></MobileSwipeLayout>} requiredRole="student" />} />

          {/* Owner Routes - Admins can access all owner routes */}
          <Route path="/owner" element={<ProtectedRoute element={<OwnerDashboard />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/listings" element={<ProtectedRoute element={<OwnerListings />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/new" element={<ProtectedRoute element={<AddNewDorm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/:dormId/rooms" element={<ProtectedRoute element={<DormRooms />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/:dormId/rooms/new" element={<ProtectedRoute element={<RoomForm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/dorms/:dormId/rooms/:roomId/edit" element={<ProtectedRoute element={<RoomForm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bulk-import" element={<ProtectedRoute element={<BulkImport />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/performance" element={<ProtectedRoute element={<OwnerPerformance />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/add-dorm" element={<ProtectedRoute element={<OwnerAddDorm />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/rooms" element={<ProtectedRoute element={<OwnerRooms />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bookings" element={<ProtectedRoute element={<OwnerBookings />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/bulk-operations" element={<ProtectedRoute element={<BulkRoomOps />} allowedRoles={["owner", "admin"]} />} />
          <Route path="/owner/reviews" element={<ProtectedRoute element={<ReviewManagement />} allowedRoles={["owner", "admin"]} />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />} />
          <Route path="/admin/analytics" element={<ProtectedRoute element={<Analytics />} requiredRole="admin" />} />
          <Route path="/admin/trends" element={<ProtectedRoute element={<Trends />} requiredRole="admin" />} />
          <Route path="/admin/students" element={<ProtectedRoute element={<AdminStudents />} requiredRole="admin" />} />
          <Route path="/admin/dorms" element={<ProtectedRoute element={<AdminDorms />} requiredRole="admin" />} />
          <Route path="/admin/ownership" element={<ProtectedRoute element={<AdminDormOwnership />} requiredRole="admin" />} />
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
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
