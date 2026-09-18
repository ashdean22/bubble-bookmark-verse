import React, { useState, useEffect, Suspense, memo } from 'react';
import { BubbleCanvas } from '@/components/BubbleCanvas';
import { BubbleHeaderMinimal } from '@/components/BubbleHeaderMinimal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { AbstractBackground } from '@/components/AbstractBackground';
import { ErrorBoundary } from '@/components/ErrorBoundary';
// Small and always needed the moment the free limit is reached — never lazy,
// so a flaky mobile chunk request can never break the limit flow.
import { UpgradePromptModal } from '@/components/UpgradePromptModal';

import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Bookmark } from '@/pages/Index';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

import { validateStoredBookmarks, sanitizeText, sanitizeUrl, safeFavicon, checkRateLimit } from '@/utils/security';

// ── Lazy-load heavy modals & analytics so they never block first paint ──
const AddBookmarkModal    = lazyWithRetry(() => import('@/components/AddBookmarkModal').then(m => ({ default: m.AddBookmarkModal })));
const EditBubbleModal     = lazyWithRetry(() => import('@/components/EditBubbleModal').then(m => ({ default: m.EditBubbleModal })));

const PricingModal        = lazyWithRetry(() => import('@/components/PricingModal').then(m => ({ default: m.PricingModal })));
// AnalyticsInsights is the heaviest — recharts 223 KB — always lazy
const AnalyticsInsights   = lazyWithRetry(() => import('@/components/AnalyticsInsights').then(m => ({ default: m.AnalyticsInsights })));

// Normalize hostname: strip www. so nba.com and www.nba.com are treated as the same
const getHostname = (url: string) => {
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, '');
  } catch { return url; }
};

const deduplicateBookmarks = (bms: Bookmark[]): Bookmark[] => {
  const seen = new Set<string>();
  return bms.filter(b => {
    const host = getHostname(b.url);
    if (seen.has(host)) return false;
    seen.add(host);
    return true;
  });
};

const normalizeBookmarks = (value: unknown): Bookmark[] => {
  if (!Array.isArray(value)) return [];
  return deduplicateBookmarks(validateStoredBookmarks(value) as Bookmark[]);
};

const normalizeBubbleCount = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
};

// Analytics panel wrapper — only rendered when toggled open, zero cost otherwise
const AnalyticsPanel = memo(({
  bookmarks,
  currentSubscription,
  onUpgradeClick,
}: {
  bookmarks: Bookmark[];
  currentSubscription: string | null;
  onUpgradeClick: () => void;
}) => (
  <div className="relative z-20 p-4 md:p-6">
    <div className="max-w-7xl mx-auto">
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }>
        <AnalyticsInsights
          bookmarks={bookmarks}
          currentSubscription={currentSubscription}
          onUpgradeClick={onUpgradeClick}
        />
      </Suspense>
    </div>
  </div>
));
AnalyticsPanel.displayName = 'AnalyticsPanel';

const FREE_BUBBLE_LIMIT = 10;
const LOW_BUBBLE_WARNING_AT = 8;
const PAID_TIERS = ['pro', 'pro_yearly', 'lifetime', 'premium'];

export const RefactoredIndex = () => {
  // State management using custom hooks
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('bubbleBookmarks', [], normalizeBookmarks);
  const [currentSubscription, setCurrentSubscription] = useLocalStorage<string | null>('currentSubscription', null);

  // Kept only for older saved sessions.
  const initializeBubbles = () => 999;
  
  const [availableBubbles, setAvailableBubbles] = useLocalStorage('availableBubbles', initializeBubbles(), normalizeBubbleCount);
  
  // Modal states — all false on first paint (nothing heavy loaded)
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // Preload heavy chunks after the main thread is idle — improves perceived perf
  useEffect(() => {
    const preload = () => {
      import('@/components/AddBookmarkModal');
      import('@/components/PricingModal');
    };
    const hasRIC = typeof window !== 'undefined'
      && typeof window.requestIdleCallback === 'function'
      && typeof window.cancelIdleCallback === 'function';
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let ricId: number | undefined;
    if (hasRIC) {
      ricId = window.requestIdleCallback(preload, { timeout: 3000 });
    } else {
      timerId = setTimeout(preload, 2000);
    }
    return () => {
      if (ricId !== undefined) window.cancelIdleCallback(ricId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);
  
  const { toast } = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateBubble: () => handleCreateBubble(),
    onBuyBubbles: () => setShowPricingModal(true),
    onShowAnalytics: () => setShowAnalytics(prev => !prev),
    onShowHelp: () => toast({
      title: "Keyboard Shortcuts 🚀",
      description: "Ctrl/Cmd + N: Create bubble | Ctrl/Cmd + B: Buy bubbles | Ctrl/Cmd + A: Analytics | ?: Help",
    }),
  });

  // Free includes 10 bubbles; paid plans are unlimited.
  const isPaidPlan = !!currentSubscription && PAID_TIERS.includes(currentSubscription);
  const maxBubbles = isPaidPlan ? Number.POSITIVE_INFINITY : FREE_BUBBLE_LIMIT;
  const usedBubbles = bookmarks.length;

  const handleUpgradePromptClose = () => {
    setShowUpgradePrompt(false);
  };

  // Reaching the free limit opens the upgrade prompt instead of the add form.
  const handleCreateBubble = () => {
    if (!isPaidPlan && bookmarks.length >= FREE_BUBBLE_LIMIT) {
      setShowUpgradePrompt(true);
      return;
    }
    setShowAddModal(true);
  };


  const handleUpgradeFromPrompt = () => {
    setShowUpgradePrompt(false);
    setShowPricingModal(true);
  };

  // Business logic functions
  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
  };

  const addBookmark = (bookmark: Omit<Bookmark, 'id' | 'x' | 'y' | 'size' | 'color' | 'accessCount'>) => {
    // Free plan cap. Existing bubbles are never removed — only new ones are blocked.
    if (!isPaidPlan && bookmarks.length >= FREE_BUBBLE_LIMIT) {
      setShowAddModal(false);
      setShowUpgradePrompt(true);
      return;
    }

    if (!checkRateLimit('add_bookmark_main', 20, 60_000)) {
      toast({ title: "Too many requests", description: "Please slow down.", variant: "destructive" });
      return;
    }


    let safeUrl: string;
    let safeTitle: string;
    try {
      safeUrl = sanitizeUrl(bookmark.url);
      safeTitle = sanitizeText(bookmark.title || '', 200) || new URL(safeUrl).hostname;
    } catch {
      toast({ title: "Invalid URL 🚫", description: "Only http/https URLs are allowed.", variant: "destructive" });
      return;
    }

    const incomingDomain = getHostname(safeUrl);
    const isDuplicate = bookmarks.some(b => getHostname(b.url) === incomingDomain);
    if (isDuplicate) {
      toast({
        title: "Duplicate bubble! 🫧",
        description: `A bubble for ${incomingDomain} already exists.`,
        variant: "destructive",
      });
      return;
    }

    const colors = [
      'rgb(147, 51, 234)', 'rgb(59, 130, 246)', 'rgb(16, 185, 129)',
      'rgb(245, 158, 11)', 'rgb(239, 68, 68)', 'rgb(236, 72, 153)',
    ];

    const newBookmark: Bookmark = {
      ...bookmark,
      url: safeUrl,
      title: safeTitle,
      favicon: safeFavicon(safeUrl),
      id: Date.now().toString(),
      x: Math.random() * (window.innerWidth - 100),
      y: Math.random() * (window.innerHeight - 100),
      size: 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      accessCount: 0,
    };

    const newBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(newBookmarks);
    setAvailableBubbles(availableBubbles - 1);
    
    const remaining = FREE_BUBBLE_LIMIT - newBookmarks.length;
    const showLowWarning = !isPaidPlan && newBookmarks.length >= LOW_BUBBLE_WARNING_AT && remaining > 0;

    toast({
      title: "Bubble created! 🫧",
      description: showLowWarning
        ? `${remaining} free ${remaining === 1 ? 'bubble' : 'bubbles'} left.`
        : "Your new bubble is floating in the bubble universe ✨",
    });

  };

  const removeBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id);
    saveBookmarks(newBookmarks);
    setAvailableBubbles(availableBubbles + 1);
    toast({ title: "Bubble popped! 💥", description: "Bubble returned to your bubble collection" });
  };

  const incrementAccessCount = (id: string) => {
    const now = Date.now();
    const updatedBookmarks = bookmarks.map(bookmark => 
      bookmark.id === id 
        ? { 
            ...bookmark, 
            accessCount: bookmark.accessCount + 1,
            lastAccessed: now,
            accessHistory: [...(bookmark.accessHistory || []), now],
          }
        : bookmark
    );
    saveBookmarks(updatedBookmarks);
  };

  const editBookmark = (id: string, updates: { url: string; title: string; favicon: string }) => {
    const updatedBookmarks = bookmarks.map(b =>
      b.id === id ? { ...b, ...updates } : b
    );
    saveBookmarks(updatedBookmarks);
    toast({ title: "Bubble updated! ✏️", description: "Your bubble has been saved." });
  };


  const onPurchaseComplete = (bubbleCount: number, tier?: string) => {
    setAvailableBubbles(availableBubbles + bubbleCount);
    if (tier) setCurrentSubscription(tier);
    toast({
      title: "Bubbles delivered! 🎉",
      description: `${bubbleCount} fresh bubbles added to your collection!`,
    });
  };

  return (
    <ErrorBoundary>
      <div className="bubble-stage min-h-screen bg-background relative overflow-hidden font-body">
        <AbstractBackground />

        <BubbleHeaderMinimal
          usedBubbles={usedBubbles}
          maxBubbles={maxBubbles}
        />

        <FloatingActionButton
          onCreateBubble={handleCreateBubble}
          onBuyBubbles={() => setShowPricingModal(true)}
          onShowAnalytics={() => setShowAnalytics(prev => !prev)}
          showAnalytics={showAnalytics}
        />

        {showAnalytics && (
          <AnalyticsPanel
            bookmarks={bookmarks}
            currentSubscription={currentSubscription}
            onUpgradeClick={() => setShowPricingModal(true)}
          />
        )}

        <BubbleCanvas 
          bookmarks={bookmarks} 
          onRemoveBookmark={removeBookmark}
          onBubbleClick={incrementAccessCount}
          onEditBookmark={setEditingBookmark}
          currentSubscription={currentSubscription}
        />

        {bookmarks.length === 0 && (
          <WelcomeMessage onCreateBubble={handleCreateBubble} />
        )}

        {/* Limit prompt is bundled with the app so it always opens instantly */}
        {showUpgradePrompt && (
          <UpgradePromptModal
            isOpen={showUpgradePrompt}
            onClose={handleUpgradePromptClose}
            onUpgrade={handleUpgradeFromPrompt}
          />
        )}

        {/* Modals — only rendered (and their JS loaded) when actually opened.
            A failed chunk closes the modal instead of taking the app down. */}
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            {editingBookmark && (
              <EditBubbleModal
                bookmark={editingBookmark}
                isOpen={!!editingBookmark}
                onClose={() => setEditingBookmark(null)}
                onSave={editBookmark}
              />
            )}

            {showAddModal && (
              <AddBookmarkModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={addBookmark}
              />
            )}

            {showPricingModal && (
              <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};
