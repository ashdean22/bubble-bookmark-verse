import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import { BubbleCanvas } from '@/components/BubbleCanvas';
import { BubbleHeaderMinimal } from '@/components/BubbleHeaderMinimal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { AbstractBackground } from '@/components/AbstractBackground';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Bookmark } from '@/pages/Index';
import { ParsedBookmark } from '@/utils/bookmarkParser';
import { validateStoredBookmarks, sanitizeText, sanitizeUrl, safeFavicon, checkRateLimit, isSafeUrl } from '@/utils/security';

// ── Lazy-load ALL heavy modals & analytics so they never block first paint ──
const AddBookmarkModal    = lazy(() => import('@/components/AddBookmarkModal').then(m => ({ default: m.AddBookmarkModal })));
const EditBubbleModal     = lazy(() => import('@/components/EditBubbleModal').then(m => ({ default: m.EditBubbleModal })));
const ImportBookmarksModal = lazy(() => import('@/components/ImportBookmarksModal').then(m => ({ default: m.ImportBookmarksModal })));
const PricingModal        = lazy(() => import('@/components/PricingModal').then(m => ({ default: m.PricingModal })));
const UpgradePromptModal  = lazy(() => import('@/components/UpgradePromptModal').then(m => ({ default: m.UpgradePromptModal })));
// AnalyticsInsights is the heaviest — recharts 223 KB — always lazy
const AnalyticsInsights   = lazy(() => import('@/components/AnalyticsInsights').then(m => ({ default: m.AnalyticsInsights })));

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

export const RefactoredIndex = () => {
  // State management using custom hooks
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('bubbleBookmarks', []);
  const [currentSubscription, setCurrentSubscription] = useLocalStorage<string | null>('currentSubscription', null);

  // Remove any duplicate domains from stored bookmarks on mount
  // and strip any unsafe entries from localStorage (poisoned data defense)
  useEffect(() => {
    const raw: unknown[] = JSON.parse(localStorage.getItem('bubbleBookmarks') || '[]');
    const validated = validateStoredBookmarks(raw) as Bookmark[];
    const deduped = deduplicateBookmarks(validated);
    if (deduped.length !== raw.length) {
      setBookmarks(deduped);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Initialize available bubbles based on existing bookmarks and subscription
  const initializeBubbles = () => {
    const existingBookmarks = JSON.parse(localStorage.getItem('bubbleBookmarks') || '[]');
    const subscription = localStorage.getItem('currentSubscription');
    if (subscription && subscription !== 'null') return 999;
    const usedBubbles = existingBookmarks.length;
    return Math.max(0, 3 - usedBubbles);
  };
  
  const [availableBubbles, setAvailableBubbles] = useLocalStorage('availableBubbles', initializeBubbles());
  
  // Modal states — all false on first paint (nothing heavy loaded)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptDismissed, setUpgradePromptDismissed] = useLocalStorage('upgradePromptDismissed', false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // Preload heavy chunks after the main thread is idle — improves perceived perf
  useEffect(() => {
    const id = requestIdleCallback
      ? requestIdleCallback(() => {
          import('@/components/AddBookmarkModal');
          import('@/components/PricingModal');
        }, { timeout: 3000 })
      : setTimeout(() => {
          import('@/components/AddBookmarkModal');
          import('@/components/PricingModal');
        }, 2000);
    return () => {
      if (requestIdleCallback && typeof id === 'number') cancelIdleCallback(id as number);
      else clearTimeout(id as ReturnType<typeof setTimeout>);
    };
  }, []);
  
  const { toast } = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateBubble: () => setShowAddModal(true),
    onBuyBubbles: () => setShowPricingModal(true),
    onShowAnalytics: () => setShowAnalytics(prev => !prev),
    onShowHelp: () => toast({
      title: "Keyboard Shortcuts 🚀",
      description: "Ctrl/Cmd + N: Create bubble | Ctrl/Cmd + B: Buy bubbles | Ctrl/Cmd + A: Analytics | ?: Help",
    }),
  });

  // Calculate max bubbles based on subscription
  const getMaxBubbles = () => {
    switch (currentSubscription) {
      case 'premium': return 999;
      case 'popular': return 75;
      case 'basic': return 25;
      default: return 3;
    }
  };

  const maxBubbles = getMaxBubbles();
  const usedBubbles = bookmarks.length;
  const usagePercent = (usedBubbles / maxBubbles) * 100;

  // Show upgrade prompt at 80% capacity (only for non-premium users)
  useEffect(() => {
    if (
      usagePercent >= 80 && 
      currentSubscription !== 'premium' && 
      !upgradePromptDismissed &&
      !showPricingModal
    ) {
      setShowUpgradePrompt(true);
    }
  }, [usedBubbles, maxBubbles, currentSubscription, upgradePromptDismissed, showPricingModal]);

  const handleUpgradePromptClose = () => {
    setShowUpgradePrompt(false);
    setUpgradePromptDismissed(true);
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
    if (availableBubbles <= 0) {
      toast({
        title: "Free bubble limit reached! 🫧",
        description: "You've used all 3 free bubbles. Upgrade to create unlimited bubbles!",
        variant: "destructive",
      });
      setShowPricingModal(true);
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
    
    const remainingBubbles = availableBubbles - 1;
    let description = `Your new bubble is floating in the bubble universe ✨`;
    if (remainingBubbles <= 0) {
      description += ` You've reached your free limit!`;
    } else if (remainingBubbles <= 2) {
      description += ` (${remainingBubbles} free bubbles remaining - almost at your limit!)`;
    } else {
      description += ` (${remainingBubbles} free bubbles remaining)`;
    }
    
    toast({ title: "Bubble created! 🫧", description });
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

  const importBookmarks = (parsedBookmarks: ParsedBookmark[]) => {
    const colors = [
      'rgb(147, 51, 234)', 'rgb(59, 130, 246)', 'rgb(16, 185, 129)',
      'rgb(245, 158, 11)', 'rgb(239, 68, 68)', 'rgb(236, 72, 153)',
    ];

    const existingDomains = new Set(bookmarks.map(b => getHostname(b.url)));
    
    const uniqueParsed: ParsedBookmark[] = [];
    const seenDomains = new Set<string>();
    
    parsedBookmarks.forEach(bookmark => {
      if (!isSafeUrl(bookmark.url)) return;
      const domain = getHostname(bookmark.url);
      if (!existingDomains.has(domain) && !seenDomains.has(domain)) {
        uniqueParsed.push({
          url: bookmark.url,
          title: sanitizeText(bookmark.title, 200),
          favicon: safeFavicon(bookmark.url),
        });
        seenDomains.add(domain);
      }
    });

    const newBookmarks: Bookmark[] = uniqueParsed.map((bookmark, index) => ({
      ...bookmark,
      id: `${Date.now()}-${index}`,
      x: Math.random() * (window.innerWidth - 100),
      y: Math.random() * (window.innerHeight - 100),
      size: 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      accessCount: 0,
    }));

    const allBookmarks = [...bookmarks, ...newBookmarks];
    saveBookmarks(allBookmarks);
    setAvailableBubbles(prev => prev - newBookmarks.length);

    const skipped = parsedBookmarks.length - newBookmarks.length;
    const description = skipped > 0 
      ? `${newBookmarks.length} bubbles imported, ${skipped} duplicates/unsafe skipped!`
      : "Your bookmarks are now floating in the bubble universe!";

    toast({ title: `Imported ${newBookmarks.length} bubbles! 🎉`, description });
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
      <div className="min-h-screen bg-background relative overflow-hidden font-body">
        <AbstractBackground />

        <BubbleHeaderMinimal
          usedBubbles={usedBubbles}
          maxBubbles={maxBubbles}
        />

        <FloatingActionButton
          onCreateBubble={() => setShowAddModal(true)}
          onBuyBubbles={() => setShowPricingModal(true)}
          onShowAnalytics={() => setShowAnalytics(prev => !prev)}
          onImportBookmarks={() => setShowImportModal(true)}
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
          <WelcomeMessage onCreateBubble={() => setShowAddModal(true)} />
        )}

        {/* Modals — only rendered (and their JS loaded) when actually opened */}
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

          {showImportModal && (
            <ImportBookmarksModal
              isOpen={showImportModal}
              onClose={() => setShowImportModal(false)}
              onImport={importBookmarks}
              availableBubbles={availableBubbles}
              isPremium={currentSubscription === 'premium'}
            />
          )}

          {showPricingModal && (
            <PricingModal
              isOpen={showPricingModal}
              onClose={() => setShowPricingModal(false)}
              onPurchaseComplete={onPurchaseComplete}
            />
          )}

          {showUpgradePrompt && (
            <UpgradePromptModal
              isOpen={showUpgradePrompt}
              onClose={handleUpgradePromptClose}
              onUpgrade={handleUpgradeFromPrompt}
              currentTier={currentSubscription || 'free'}
              usedBubbles={usedBubbles}
              maxBubbles={maxBubbles}
            />
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};
