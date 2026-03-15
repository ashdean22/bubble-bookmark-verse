import React, { useState, useEffect } from 'react';
import { BubbleCanvas } from '@/components/BubbleCanvas';
import { AddBookmarkModal } from '@/components/AddBookmarkModal';
import { EditBubbleModal } from '@/components/EditBubbleModal';
import { ImportBookmarksModal } from '@/components/ImportBookmarksModal';
import { PricingModal } from '@/components/PricingModal';
import { UpgradePromptModal } from '@/components/UpgradePromptModal';
import { AnalyticsInsights } from '@/components/AnalyticsInsights';
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

export const RefactoredIndex = () => {
  // State management using custom hooks
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('bubbleBookmarks', []);
  const [currentSubscription, setCurrentSubscription] = useLocalStorage<string | null>('currentSubscription', null);
  
  // Initialize available bubbles based on existing bookmarks and subscription
  const initializeBubbles = () => {
    const existingBookmarks = JSON.parse(localStorage.getItem('bubbleBookmarks') || '[]');
    const subscription = localStorage.getItem('currentSubscription');
    
    if (subscription && subscription !== 'null') {
      // Premium users get unlimited bubbles
      return 999;
    } else {
      // Free users: 3 total bubbles minus existing bookmarks
      const usedBubbles = existingBookmarks.length;
      return Math.max(0, 3 - usedBubbles);
    }
  };
  
  const [availableBubbles, setAvailableBubbles] = useLocalStorage('availableBubbles', initializeBubbles());
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptDismissed, setUpgradePromptDismissed] = useLocalStorage('upgradePromptDismissed', false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  
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
    // Size is now calculated dynamically in BubbleCanvas based on access count
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

    // Check for duplicate domain
    const getHostname = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };
    const incomingDomain = getHostname(bookmark.url);
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
    
    toast({
      title: "Bubble created! 🫧",
      description: description,
    });
  };

  const removeBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id);
    saveBookmarks(newBookmarks);
    setAvailableBubbles(availableBubbles + 1);
    
    toast({
      title: "Bubble popped! 💥",
      description: "Bubble returned to your bubble collection",
    });
  };

  const incrementAccessCount = (id: string) => {
    const updatedBookmarks = bookmarks.map(bookmark => 
      bookmark.id === id 
        ? { ...bookmark, accessCount: bookmark.accessCount + 1 }
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

    const newBookmarks: Bookmark[] = parsedBookmarks.map((bookmark, index) => ({
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

    toast({
      title: `Imported ${newBookmarks.length} bubbles! 🎉`,
      description: "Your bookmarks are now floating in the bubble universe!",
    });
  };

  const onPurchaseComplete = (bubbleCount: number, tier?: string) => {
    setAvailableBubbles(availableBubbles + bubbleCount);
    
    if (tier) {
      setCurrentSubscription(tier);
    }
    
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
          <div className="relative z-20 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <AnalyticsInsights 
                bookmarks={bookmarks}
                currentSubscription={currentSubscription}
                onUpgradeClick={() => setShowPricingModal(true)}
              />
            </div>
          </div>
        )}

        <BubbleCanvas 
          bookmarks={bookmarks} 
          onRemoveBookmark={removeBookmark}
          onBubbleClick={incrementAccessCount}
          onEditBookmark={setEditingBookmark}
          currentSubscription={currentSubscription}
        />

        <EditBubbleModal
          bookmark={editingBookmark}
          isOpen={!!editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSave={editBookmark}
        />

        {bookmarks.length === 0 && (
          <WelcomeMessage onCreateBubble={() => setShowAddModal(true)} />
        )}

        {/* Modals */}
        <AddBookmarkModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={addBookmark}
        />

        <ImportBookmarksModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={importBookmarks}
          availableBubbles={availableBubbles}
          isPremium={currentSubscription === 'premium'}
        />

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onPurchaseComplete={onPurchaseComplete}
        />

        <UpgradePromptModal
          isOpen={showUpgradePrompt}
          onClose={handleUpgradePromptClose}
          onUpgrade={handleUpgradeFromPrompt}
          currentTier={currentSubscription || 'free'}
          usedBubbles={usedBubbles}
          maxBubbles={maxBubbles}
        />
      </div>
    </ErrorBoundary>
  );
};