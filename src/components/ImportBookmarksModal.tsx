import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileUp, Check, X, Loader2, Chrome, Globe } from 'lucide-react';
import { parseBookmarkHtml, readFileAsText, ParsedBookmark } from '@/utils/bookmarkParser';
import { cn } from '@/lib/utils';

interface ImportBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (bookmarks: ParsedBookmark[]) => void;
  availableBubbles: number;
  isPremium: boolean;
}

export const ImportBookmarksModal = ({
  isOpen,
  onClose,
  onImport,
  availableBubbles,
  isPremium,
}: ImportBookmarksModalProps) => {
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      toast({
        title: "Invalid file format",
        description: "Please select an HTML bookmark file exported from your browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const content = await readFileAsText(file);
      const bookmarks = parseBookmarkHtml(content);
      
      if (bookmarks.length === 0) {
        toast({
          title: "No bookmarks found",
          description: "The file doesn't contain any valid bookmarks.",
          variant: "destructive",
        });
      } else {
        setParsedBookmarks(bookmarks);
        // Pre-select all bookmarks up to available limit
        const maxToSelect = isPremium ? bookmarks.length : Math.min(bookmarks.length, availableBubbles);
        setSelectedBookmarks(new Set(Array.from({ length: maxToSelect }, (_, i) => i)));
        
        toast({
          title: `Found ${bookmarks.length} bookmarks! 📚`,
          description: "Select which ones to import as bubbles.",
        });
      }
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Could not parse the bookmark file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const toggleBookmark = (index: number) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      if (!isPremium && newSelected.size >= availableBubbles) {
        toast({
          title: "Bubble limit reached",
          description: `You can only import ${availableBubbles} more bubbles. Upgrade for unlimited!`,
          variant: "destructive",
        });
        return;
      }
      newSelected.add(index);
    }
    setSelectedBookmarks(newSelected);
  };

  const selectAll = () => {
    const maxToSelect = isPremium ? parsedBookmarks.length : Math.min(parsedBookmarks.length, availableBubbles);
    setSelectedBookmarks(new Set(Array.from({ length: maxToSelect }, (_, i) => i)));
  };

  const selectNone = () => {
    setSelectedBookmarks(new Set());
  };

  const handleImport = () => {
    const bookmarksToImport = parsedBookmarks.filter((_, index) => selectedBookmarks.has(index));
    onImport(bookmarksToImport);
    
    // Reset state
    setParsedBookmarks([]);
    setSelectedBookmarks(new Set());
    onClose();
  };

  const handleClose = () => {
    setParsedBookmarks([]);
    setSelectedBookmarks(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg bg-slate-900 border-purple-500/30 p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Import Browser Bookmarks
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Import bookmarks from Chrome, Firefox, Safari, Edge, or any browser
          </DialogDescription>
        </DialogHeader>

        {parsedBookmarks.length === 0 ? (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="glass-card p-4 rounded-lg space-y-3">
              <h4 className="text-purple-300 font-medium flex items-center gap-2">
                <Chrome className="w-4 h-4" />
                How to export bookmarks:
              </h4>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                <li><strong>Chrome:</strong> Menu → Bookmarks → Bookmark Manager → ⋮ → Export bookmarks</li>
                <li><strong>Firefox:</strong> Menu → Bookmarks → Manage → Import/Export → Export to HTML</li>
                <li><strong>Safari:</strong> File → Export Bookmarks</li>
                <li><strong>Edge:</strong> Menu → Favorites → ⋯ → Export favorites</li>
              </ol>
            </div>

            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                dragActive 
                  ? "border-purple-400 bg-purple-500/20" 
                  : "border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                  <p className="text-slate-300">Parsing bookmarks...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileUp className="w-10 h-10 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Drop bookmark file here</p>
                    <p className="text-slate-400 text-sm mt-1">or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Selection controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">
                <span className="text-purple-400 font-medium">{selectedBookmarks.size}</span> of {parsedBookmarks.length} selected
                {!isPremium && (
                  <span className="text-slate-500 ml-2">
                    ({availableBubbles} bubbles available)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-purple-300 hover:text-purple-200 h-8"
                >
                  Select all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectNone}
                  className="text-slate-400 hover:text-slate-300 h-8"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Bookmark list */}
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-2 pb-2">
                {parsedBookmarks.map((bookmark, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                      selectedBookmarks.has(index)
                        ? "bg-purple-500/20 border border-purple-500/40"
                        : "bg-slate-800/50 border border-transparent hover:bg-slate-800"
                    )}
                    onClick={() => toggleBookmark(index)}
                  >
                    <Checkbox
                      checked={selectedBookmarks.has(index)}
                      className="border-purple-500/50 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                    />
                    <img
                      src={bookmark.favicon}
                      alt=""
                      className="w-5 h-5 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2NjYiLz4KPC9zdmc+';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{bookmark.title}</p>
                      <p className="text-slate-400 text-xs truncate">{bookmark.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 min-h-[44px] sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedBookmarks.size === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white min-h-[44px] sm:flex-1"
              >
                Import {selectedBookmarks.size} Bubble{selectedBookmarks.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
