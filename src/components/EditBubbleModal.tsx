import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { Bookmark } from '@/pages/Index';

interface EditBubbleModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { url: string; title: string; favicon: string }) => void;
}

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
};

export const EditBubbleModal = ({ bookmark, isOpen, onClose, onSave }: EditBubbleModalProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url);
      setTitle(bookmark.title);
    }
  }, [bookmark]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmark || !url.trim()) return;
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const finalTitle = title.trim() || new URL(normalizedUrl).hostname;
    onSave(bookmark.id, {
      url: normalizedUrl,
      title: finalTitle,
      favicon: getFaviconUrl(normalizedUrl),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md bg-slate-900 border-purple-500/30 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Pencil className="w-5 h-5 mr-2 text-purple-400" />
            Edit Bubble
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-url" className="text-purple-300">Website URL</Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="bg-slate-800 border-purple-500/30 text-white placeholder:text-slate-400 focus:border-purple-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-purple-300">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Site name"
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
