import React, { useState } from 'react';
import { BubbleCanvas } from '@/components/BubbleCanvas';
import { AddBookmarkModal } from '@/components/AddBookmarkModal';
import { PricingModal } from '@/components/PricingModal';
import { AnalyticsInsights } from '@/components/AnalyticsInsights';
import { BubbleHeader } from '@/components/BubbleHeader';
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { AbstractBackground } from '@/components/AbstractBackground';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Bookmark } from '@/pages/Index';

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
      // Free users: 5 total bubbles minus existing bookmarks
      const usedBubbles = existingBookmarks.length;
      return Math.max(0, 5 - usedBubbles);
    }
  };
  
  const [availableBubbles, setAvailableBubbles] = useLocalStorage('availableBubbles', initializeBubbles());
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
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

  // Business logic functions
  const calculateBubbleSize = (accessCount: number, allBookmarks: Bookmark[]) => {
    if (allBookmarks.length === 0) return 60;
    
    const maxAccess = Math.max(...allBookmarks.map(b => b.accessCount));
    const minAccess = Math.min(...allBookmarks.map(b => b.accessCount));
    
    if (maxAccess === minAccess) return 60;
    
    const minSize = 45;
    const maxSize = 90;
    const normalizedAccess = maxAccess > 0 ? (accessCount - minAccess) / (maxAccess - minAccess) : 0;
    
    return Math.round(minSize + (normalizedAccess * (maxSize - minSize)));
  };

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    const bookmarksWithUpdatedSizes = newBookmarks.map(bookmark => ({
      ...bookmark,
      size: calculateBubbleSize(bookmark.accessCount, newBookmarks)
    }));
    
    setBookmarks(bookmarksWithUpdatedSizes);
  };

  const addBookmark = (bookmark: Omit<Bookmark, 'id' | 'x' | 'y' | 'size' | 'color' | 'accessCount'>) => {
    if (availableBubbles <= 0) {
      toast({
        title: "Free bubble limit reached! 🫧",
        description: "You've used all 5 free bubbles. Upgrade to create unlimited bubbles!",
        variant: "destructive",
      });
      setShowPricingModal(true);
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

        <BubbleHeader
          availableBubbles={availableBubbles}
          onCreateBubble={() => setShowAddModal(true)}
          onBuyBubbles={() => setShowPricingModal(true)}
          onShowAnalytics={() => setShowAnalytics(prev => !prev)}
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
          currentSubscription={currentSubscription}
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

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onPurchaseComplete={onPurchaseComplete}
        />

        
      </div>
    </ErrorBoundary>
  );
};