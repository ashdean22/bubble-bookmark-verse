import { Button } from '@/components/ui/button';
import { Plus, Circle } from 'lucide-react';

interface WelcomeMessageProps {
  onCreateBubble: () => void;
}

export const WelcomeMessage = ({ onCreateBubble }: WelcomeMessageProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="relative w-20 h-20 mx-auto mb-6" role="img" aria-label="Welcome bubble animation">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <Circle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-80 animate-pulse" aria-hidden="true"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} aria-hidden="true"></div>
        </div>
        
        <h2 className="text-3xl font-brand font-bold text-white mb-4">
          Welcome to the Bubble Universe
        </h2>
        
        <p className="text-purple-300 mb-6 font-body">
          Start creating your bubble collection to organize your favorite websites.
        </p>
        
        <Button
          onClick={onCreateBubble}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 font-body font-medium shadow-lg hover:shadow-xl transition-all"
          aria-label="Create your first bubble"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Create Your First Bubble
        </Button>
      </div>
    </div>
  );
};