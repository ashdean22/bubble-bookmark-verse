import { Button } from "@/components/ui/button";
import { Home, Circle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-body">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Floating bubbles animation */}
        <div className="relative w-32 h-32 mx-auto mb-8" role="img" aria-label="Lost bubbles animation">
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="w-16 h-16 text-purple-400" />
          </div>
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 animate-bounce" style={{ animationDelay: '0s' }} aria-hidden="true"></div>
          <div className="absolute top-4 right-2 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70 animate-bounce" style={{ animationDelay: '0.5s' }} aria-hidden="true"></div>
          <div className="absolute bottom-2 left-8 w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 opacity-50 animate-bounce" style={{ animationDelay: '1s' }} aria-hidden="true"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-80 animate-bounce" style={{ animationDelay: '1.5s' }} aria-hidden="true"></div>
        </div>

        <h1 className="text-8xl font-brand font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-brand font-semibold text-white mb-4">
          This bubble floated away!
        </h2>
        
        <p className="text-purple-300 mb-8">
          The page you're looking for seems to have popped. 
          Let's get you back to your bubble universe! 🫧
        </p>
        
        <div className="space-y-4">
          <Link to="/">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 font-medium shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Return to Bubble Universe
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;