import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import { TearFilter } from "@/components/bubble/Bubble";

const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));

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
    // Mount just after the first paint so notifications work immediately
    // without competing with the initial render.
    const id = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(id);
  }, []);
  if (!ready) return null;
  // Optional extras are isolated: if one of these chunks fails to load,
  // the bookmark board must keep working instead of being replaced.
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <Toaster />
        <Sonner />
      </Suspense>
    </ErrorBoundary>
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
      <TearFilter />
      <Suspense fallback={<RouteFallback />}>
        {isHome ? <Index /> : <InlineNotFound />}
      </Suspense>
      <DeferredUtilities />
    </ErrorBoundary>
  );
};

export default App;
