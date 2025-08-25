import { Link } from 'react-router-dom';
import { Circle, Heart, Twitter, Github, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative z-20 bg-slate-900/80 backdrop-blur-sm border-t border-purple-500/20 font-body">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Circle className="w-6 h-6 text-purple-400" />
              <span className="text-white font-brand font-semibold text-lg">BubbleLink</span>
            </div>
            <p className="text-purple-300 text-sm">
              Transform your bookmarks into beautiful floating bubbles. 
              Save, organize, and access your favorite sites with style.
            </p>
          </div>
          
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-purple-500/20 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-purple-300 text-sm">
            © {new Date().getFullYear()} BubbleLink. All rights reserved.
          </div>
          <div className="flex items-center space-x-1 text-purple-300 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-pink-400 fill-current" />
            <span>for bookmark lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};