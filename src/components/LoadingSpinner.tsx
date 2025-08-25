import { Circle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <Circle className={`${sizeClasses[size]} text-purple-400 animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        </div>
      </div>
      {text && (
        <p className="text-purple-300 text-sm mt-4 font-body">
          {text}
        </p>
      )}
    </div>
  );
};