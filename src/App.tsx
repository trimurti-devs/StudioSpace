import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Canvas from "./pages/Canvas";
import MyAccount from "./pages/MyAccount";
import Explore from "./pages/Explore";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import SharedBoard from "./pages/SharedBoard";
import ColorHarmonizer from "./pages/ColorHarmonizer";
import InspirationRoulette from "./pages/InspirationRoulette";
import LikedMoodboards from "./pages/LikedMoodboards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/canvas" element={<Canvas />} />
            <Route path="/account" element={<MyAccount />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/shared/:token" element={<SharedBoard />} />
            <Route path="/harmonizer" element={<ColorHarmonizer />} />
            <Route path="/inspire" element={<InspirationRoulette />} />
            <Route path="/liked" element={<LikedMoodboards />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
