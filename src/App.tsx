import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";

const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));
const DiagnosticsButton = lazy(() =>
  import("@/components/DiagnosticsButton").then((m) => ({ default: m.DiagnosticsButton })),
);

const RouteFallback = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const InlineNotFound = () => (
  <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 text-center">
    <div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <a className="text-primary hover:underline" href="/">Return to BubbleMark</a>
    </div>
  </main>
);

const DeferredUtilities = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(id);
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
      <DiagnosticsButton />
    </Suspense>
  );
};

const App = () => {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const isHome = path === "/" || path === "/index";

  useEffect(() => {
    const watchdog = (window as unknown as { __bootWatchdog?: number }).__bootWatchdog;
    if (watchdog !== undefined) window.clearTimeout(watchdog);
    document.documentElement.classList.add("app-ready");
    document.getElementById("boot")?.remove();
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        {isHome ? <Index /> : <InlineNotFound />}
      </Suspense>
      <DeferredUtilities />
    </ErrorBoundary>
  );
};

export default App;
