import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ChatbotBubble } from "./components/ChatbotBubble";
import ErrorBoundary from "./components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import BottomNav from "./components/BottomNav";
import MobileNavbar from "./components/MobileNavbar";
import { SwipeableRoutes } from "./components/SwipeableRoutes";

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
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Settings = lazy(() => import("./pages/Settings"));
const Messages = lazy(() => import("./pages/Messages"));
const OwnerAddDorm = lazy(() => import("./pages/owner/OwnerAddDorm"));
const ClaimDorm = lazy(() => import("./pages/owner/ClaimDorm"));
const OwnerRooms = lazy(() => import("./pages/owner/OwnerRooms"));
const OwnerBookings = lazy(() => import("./pages/owner/OwnerBookings"));

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
}: {
  element: JSX.Element;
  requiredRole: "admin" | "owner" | "user";
}) {
  const { loading, role } = useRoleGuard(requiredRole);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  if (role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return element;
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MobileNavbar />
          <Suspense fallback={<PageLoader />}>
            <SwipeableRoutes>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Main />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/intro" element={<Intro />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/dorm/:id" element={<DormDetail />} />
              <Route path="/ai-match" element={<AiMatch />} />
              <Route path="/ai-chat" element={<AiChat />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Dashboards */}
        <Route
          path="/dashboard/student"
          element={<ProtectedRoute element={<StudentDashboard />} requiredRole="user" />}
        />
        <Route
          path="/dashboard/owner"
          element={<ProtectedRoute element={<OwnerDashboard />} requiredRole="owner" />}
        />
        <Route
          path="/dashboard/admin"
          element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />}
        />
              <Route
                path="/admin/analytics"
                element={<ProtectedRoute element={<Analytics />} requiredRole="admin" />}
              />
              <Route
                path="/admin/trends"
                element={<ProtectedRoute element={<Trends />} requiredRole="admin" />}
              />
              <Route
                path="/owner/performance"
                element={<ProtectedRoute element={<OwnerPerformance />} requiredRole="owner" />}
              />
              <Route
                path="/owner/add-dorm"
                element={<ProtectedRoute element={<OwnerAddDorm />} requiredRole="owner" />}
              />
              <Route
                path="/owner/claim-dorm"
                element={<ProtectedRoute element={<ClaimDorm />} requiredRole="owner" />}
              />
              <Route
                path="/owner/rooms"
                element={<ProtectedRoute element={<OwnerRooms />} requiredRole="owner" />}
              />
              <Route
                path="/owner/edit-dorm/:id"
                element={<ProtectedRoute element={<OwnerAddDorm />} requiredRole="owner" />}
              />

              {/* Owner Routes (legacy support) */}
              <Route
                path="/owner/*"
                element={<ProtectedRoute element={<OwnerDashboard />} requiredRole="owner" />}
              />

              {/* Admin Routes (legacy support) */}
              <Route
                path="/admin/*"
                element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />}
              />

              {/* Unauthorized Fallback */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </SwipeableRoutes>
          </Suspense>
          <BottomNav />
          <ChatbotBubble />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
