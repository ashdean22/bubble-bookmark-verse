import { useState, useEffect } from 'react';
import { BubbleCanvas } from '@/components/BubbleCanvas';
import { AddBookmarkModal } from '@/components/AddBookmarkModal';
import { PricingModal } from '@/components/PricingModal';
import { Button } from '@/components/ui/button';
import { Plus, Star, Sparkles, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  x: number;
  y: number;
  size: number;
  color: string;
  accessCount: number;
}

const Index = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [availableBubbles, setAvailableBubbles] = useState(5); // Free bubbles
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load bookmarks from localStorage
    const savedBookmarks = localStorage.getItem('bubbleBookmarks');
    if (savedBookmarks) {
      const parsed = JSON.parse(savedBookmarks);
      // Migrate old bookmarks without accessCount
      const migratedBookmarks = parsed.map((bookmark: any) => ({
        ...bookmark,
        accessCount: bookmark.accessCount || 0
      }));
      setBookmarks(migratedBookmarks);
    }
    
    // Load available bubbles count
    const savedBubbles = localStorage.getItem('availableBubbles');
    if (savedBubbles) {
      setAvailableBubbles(parseInt(savedBubbles));
    }
  }, []);

  // Calculate dynamic sizes based on access frequency
  const calculateBubbleSize = (accessCount: number, allBookmarks: Bookmark[]) => {
    if (allBookmarks.length === 0) return 60;
    
    const maxAccess = Math.max(...allBookmarks.map(b => b.accessCount));
    const minAccess = Math.min(...allBookmarks.map(b => b.accessCount));
    
    if (maxAccess === minAccess) return 60; // All have same access count
    
    // Scale between 45 (min) and 90 (max) pixels
    const minSize = 45;
    const maxSize = 90;
    const normalizedAccess = maxAccess > 0 ? (accessCount - minAccess) / (maxAccess - minAccess) : 0;
    
    return Math.round(minSize + (normalizedAccess * (maxSize - minSize)));
  };

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    // Recalculate sizes based on access frequency
    const bookmarksWithUpdatedSizes = newBookmarks.map(bookmark => ({
      ...bookmark,
      size: calculateBubbleSize(bookmark.accessCount, newBookmarks)
    }));
    
    setBookmarks(bookmarksWithUpdatedSizes);
    localStorage.setItem('bubbleBookmarks', JSON.stringify(bookmarksWithUpdatedSizes));
  };

  const saveAvailableBubbles = (count: number) => {
    setAvailableBubbles(count);
    localStorage.setItem('availableBubbles', count.toString());
  };

  const addBookmark = (bookmark: Omit<Bookmark, 'id' | 'x' | 'y' | 'size' | 'color' | 'accessCount'>) => {
    if (availableBubbles <= 0) {
      toast({
        title: "No bubbles available",
        description: "Purchase more bubbles to add bookmarks!",
        variant: "destructive",
      });
      setShowPricingModal(true);
      return;
    }

    const colors = [
      'rgb(147, 51, 234)', // purple
      'rgb(59, 130, 246)', // blue
      'rgb(16, 185, 129)', // emerald
      'rgb(245, 158, 11)', // amber
      'rgb(239, 68, 68)', // red
      'rgb(236, 72, 153)', // pink
    ];

    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      x: Math.random() * (window.innerWidth - 100),
      y: Math.random() * (window.innerHeight - 100),
      size: 60, // Will be recalculated in saveBookmarks
      color: colors[Math.floor(Math.random() * colors.length)],
      accessCount: 0,
    };

    const newBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(newBookmarks);
    saveAvailableBubbles(availableBubbles - 1);
    
    toast({
      title: "Bookmark added!",
      description: "Your new bubble is floating in space ✨",
    });
  };

  const removeBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id);
    saveBookmarks(newBookmarks);
    saveAvailableBubbles(availableBubbles + 1);
    
    toast({
      title: "Bookmark removed",
      description: "Bubble returned to your collection",
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

  const onPurchaseComplete = (bubbleCount: number) => {
    saveAvailableBubbles(availableBubbles + bubbleCount);
    toast({
      title: "Purchase successful! 🎉",
      description: `${bubbleCount} bubbles added to your collection!`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-20 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Top row with logo and bubble count */}
          <div className="flex items-center justify-between mb-4 md:mb-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">BubbleMarks</h1>
                <p className="text-purple-300 text-xs md:text-sm">Your bookmarks in space</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-white/20">
              <span className="text-white font-semibold flex items-center text-sm md:text-base">
                <Star className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-yellow-400" />
                {availableBubbles}
              </span>
            </div>
          </div>
          
          {/* Action buttons row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bookmark
            </Button>
            
            <Button
              onClick={() => setShowPricingModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 flex-1 sm:flex-none font-semibold"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Bubbles
            </Button>
          </div>
        </div>
      </header>

      {/* Main bubble canvas */}
      <BubbleCanvas 
        bookmarks={bookmarks} 
        onRemoveBookmark={removeBookmark}
        onBubbleClick={incrementAccessCount}
      />

      {/* Welcome message if no bookmarks */}
      {bookmarks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to BubbleMarks</h2>
            <p className="text-purple-300 mb-6">
              Save your favorite websites as beautiful floating bubbles. 
              Click on any bubble to visit your bookmarked site!
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Bookmark
            </Button>
          </div>
        </div>
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
  );
};

export default Index;
