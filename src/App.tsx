import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";

// Keep the home route eager so the app never shows a blank screen while booting.
const NotFound = lazy(() => import("./pages/NotFound"));
// Diagnostics is a debug affordance — never block first paint on it.
const DiagnosticsButton = lazy(() =>
  import("@/components/DiagnosticsButton").then((m) => ({ default: m.DiagnosticsButton })),
);

const RouteFallback = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Suspense fallback={null}>
            <DiagnosticsButton />
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
  </TooltipProvider>
);

export default App;
