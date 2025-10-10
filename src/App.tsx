// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { CallNotification } from "./components/CallNotification";
import Index from "./pages/Index";
import ExploreMentors from "./pages/ExploreMentors";
import MentorDashboard from "./pages/MentorDashboard";
import MenteeDashboard from "./pages/MenteeDashboard";
import BookingPage from "./pages/BookingPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import AboutPage from "./pages/AboutPage";
import BecomeMentorPage from "./pages/BecomeMentorPage";
import ContactPage from "./pages/ContactPage";
import CallPage from "./pages/CallPage";
import CategoriesPage from "./pages/CategoriesPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<ExploreMentors />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/mentor-dashboard" element={<ProtectedRoute><MentorDashboard /></ProtectedRoute>} />
            <Route path="/mentee-dashboard" element={<ProtectedRoute><MenteeDashboard /></ProtectedRoute>} />
            <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/become-mentor" element={<BecomeMentorPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/call/:sessionId" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* ✅ Global Components */}
          <CallNotification />
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
