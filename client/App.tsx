
import "./global.css";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Frontend from "./pages/RoadMaps/Frontend";
import Backend from "./pages/RoadMaps/Backend";
import Android from "./pages/RoadMaps/Android";
import Bianalyst from "./pages/RoadMaps/Bianalyst";
import CyberSecurity from "./pages/RoadMaps/CyberSecurity";
import BlockChain from "./pages/RoadMaps/BlockChain";
import FullStack from "./pages/RoadMaps/FullStack";
import DataAnalyst from "./pages/RoadMaps/DataAnalyst";
import DevOps from "./pages/RoadMaps/DevOps";
import ML from "./pages/RoadMaps/MachineLearning";
import Login from "./pages/Login";
import Diary from "./pages/Dairy";
import Signup from "./pages/SignUp";
import Header from "@/components/navbar";
import Chatbot from "./pages/chatbot";
import CourseQuiz from "./pages/Coursequiz";
import Progress from "./pages/Progress";
import MachineLearning from "./pages/MachineLearning";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          <Route path="/frontend" element={<Frontend />} />
          <Route path="/backend" element={<Backend />} />
          <Route path="/Android" element={<Android />} />
          <Route path="/Bianalyst" element={<Bianalyst />} />
          <Route path="/Cybersecurity" element={<CyberSecurity />} />
          <Route path="/BlockChain" element={<BlockChain />} />
          <Route path="/fullstack" element={<FullStack />} />
          <Route path="/DataAnalyst" element={<DataAnalyst />} />
          <Route path="/DevOps" element={<DevOps />} />
          <Route path="/machinelearning" element={<ML />} />
          <Route path="/dashboard" element={<Diary />} />
          <Route path="/scan" element={<Chatbot />} />
          <Route path="/resources" element={<CourseQuiz />} />
          <Route path="/reports" element={<Progress />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
