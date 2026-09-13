import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, ShieldCheck } from 'lucide-react';
import { Bookmark } from '@/pages/Index';
import { BookmarkInputSchema, sanitizeText, sanitizeUrl, safeFavicon } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface EditBubbleModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { url: string; title: string; favicon: string }) => void;
}

export const EditBubbleModal = ({ bookmark, isOpen, onClose, onSave }: EditBubbleModalProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [urlError, setUrlError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url);
      setTitle(bookmark.title);
      setUrlError('');
    }
  }, [bookmark]);

  const handleUrlChange = (value: string) => {
    setUrl(value.slice(0, 2048));
    setUrlError('');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value.replace(/<[^>]*>/g, '').slice(0, 200));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmark) return;

    const parsed = BookmarkInputSchema.safeParse({ url: url.trim(), title: title.trim() });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid input';
      setUrlError(msg);
      toast({ title: 'Invalid URL', description: msg, variant: 'destructive' });
      return;
    }

    try {
      const safeUrl = sanitizeUrl(parsed.data.url);
      const safeTitle = sanitizeText(parsed.data.title || '') || new URL(safeUrl).hostname;
      onSave(bookmark.id, {
        url: safeUrl,
        title: safeTitle,
        favicon: safeFavicon(safeUrl),
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Please check the URL and try again';
      setUrlError(msg);
      toast({ title: 'Error updating bubble', description: msg, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md bg-slate-900 border-purple-500/30 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-purple-400" />
            Edit Bubble
            <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto" aria-label="Inputs are sanitized" />
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-url" className="text-purple-300">Website URL</Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              maxLength={2048}
              autoComplete="url"
              spellCheck={false}
              className={`bg-slate-800 border-purple-500/30 text-white placeholder:text-slate-400 focus:border-purple-400 ${urlError ? 'border-red-500' : ''}`}
            />
            {urlError && (
              <p className="text-xs text-red-400 mt-1">{urlError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-purple-300">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Site name"
              maxLength={200}
              autoComplete="off"
              className="bg-slate-800 border-purple-500/30 text-white placeholder:text-slate-400 focus:border-purple-400"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white min-h-[44px]"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
