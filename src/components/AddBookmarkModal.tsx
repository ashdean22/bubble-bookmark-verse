import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, ShieldCheck } from 'lucide-react';
import { BookmarkInputSchema, sanitizeText, sanitizeUrl, safeFavicon, checkRateLimit } from '@/utils/security';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmark: { url: string; title: string; favicon: string }) => void;
}

export const AddBookmarkModal = ({ isOpen, onClose, onAdd }: AddBookmarkModalProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUrlChange = (value: string) => {
    // Hard-cap raw input length in the field itself
    setUrl(value.slice(0, 2048));
    setUrlError('');
  };

  const handleTitleChange = (value: string) => {
    // Strip HTML as the user types; cap at 200 chars
    setTitle(value.replace(/<[^>]*>/g, '').slice(0, 200));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate-limit: max 20 bookmarks per minute
    if (!checkRateLimit('add_bookmark', 20, 60_000)) {
      toast({
        title: 'Slow down! 🐢',
        description: "You're adding bookmarks too fast. Please wait a moment.",
        variant: 'destructive',
      });
      return;
    }

    // Zod validation
    const parsed = BookmarkInputSchema.safeParse({ url: url.trim(), title: title.trim() });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid input';
      setUrlError(msg);
      toast({ title: 'Invalid URL', description: msg, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const safeUrl = sanitizeUrl(parsed.data.url);
      const safeTitle = sanitizeText(parsed.data.title || '') || new URL(safeUrl).hostname;
      const favicon = safeFavicon(safeUrl);

      onAdd({ url: safeUrl, title: safeTitle, favicon });
      setUrl('');
      setTitle('');
      setUrlError('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Please check the URL and try again';
      setUrlError(msg);
      toast({ title: 'Error adding bookmark', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md bg-slate-900 border-purple-500/30 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            Add New Bookmark
            <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto" title="Inputs are sanitized" />
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-purple-300">Website URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              maxLength={2048}
              autoComplete="url"
              spellCheck={false}
              className={`bg-slate-800 border-purple-500/30 text-white placeholder:text-slate-400 focus:border-purple-400 ${urlError ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {urlError && (
              <p className="text-xs text-red-400 mt-1">{urlError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-purple-300">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Leave empty to auto-detect"
              maxLength={200}
              autoComplete="off"
              className="bg-slate-800 border-purple-500/30 text-white placeholder:text-slate-400 focus:border-purple-400"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white min-h-[44px]"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Bubble
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
