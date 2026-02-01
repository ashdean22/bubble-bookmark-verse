import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Eye, Clock, Crown, Lock } from 'lucide-react';
import { Bookmark } from '@/pages/Index';

interface AnalyticsInsightsProps {
  bookmarks: Bookmark[];
  currentSubscription: string | null;
  onUpgradeClick: () => void;
}

export const AnalyticsInsights = ({ bookmarks, currentSubscription, onUpgradeClick }: AnalyticsInsightsProps) => {
  const isPremium = currentSubscription === 'premium';
  
  // Calculate analytics data
  const totalClicks = bookmarks.reduce((sum, bookmark) => sum + bookmark.accessCount, 0);
  const averageClicks = bookmarks.length > 0 ? Math.round(totalClicks / bookmarks.length * 10) / 10 : 0;
  const mostUsed = bookmarks.reduce((prev, current) => 
    (prev.accessCount > current.accessCount) ? prev : current, bookmarks[0] || null
  );
  const unusedBubbles = bookmarks.filter(b => b.accessCount === 0).length;

  // Premium Analytics Content
  const PremiumContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center">
              <Eye className="w-4 h-4 mr-2 text-purple-400" />
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalClicks}</div>
            <p className="text-purple-300 text-xs">All-time clicks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" />
              Average Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{averageClicks}</div>
            <p className="text-purple-300 text-xs">Per bubble</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-cyan-400" />
              Active Bubbles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{bookmarks.length - unusedBubbles}</div>
            <p className="text-purple-300 text-xs">With interactions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2 text-amber-400" />
              Unused Bubbles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{unusedBubbles}</div>
            <p className="text-purple-300 text-xs">Never clicked</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Bubbles */}
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
            Top Performing Bubbles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookmarks
              .sort((a, b) => b.accessCount - a.accessCount)
              .slice(0, 5)
              .map((bookmark, index) => (
                <div key={bookmark.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{bookmark.title}</p>
                      <p className="text-purple-300 text-xs">{new URL(bookmark.url).hostname}</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white">
                    {bookmark.accessCount} clicks
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Locked Content for Non-Premium Users
  const LockedContent = () => (
    <div className="text-center py-12 px-6">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
          <Crown className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4">Analytics & Insights</h3>
      <p className="text-purple-300 mb-6 max-w-md mx-auto">
        Unlock detailed analytics about your bubble usage, performance metrics, and insights to optimize your bookmark experience.
      </p>
      
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 mb-6 max-w-md mx-auto">
        <h4 className="text-white font-semibold mb-3">Premium Analytics Include:</h4>
        <ul className="text-purple-300 text-sm space-y-2 text-left">
          <li className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" />
            Detailed usage statistics
          </li>
          <li className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-cyan-400" />
            Performance rankings
          </li>
          <li className="flex items-center">
            <Eye className="w-4 h-4 mr-2 text-purple-400" />
            Click-through analytics
          </li>
          <li className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-amber-400" />
            Usage patterns & trends
          </li>
        </ul>
      </div>
      
      <Button
        onClick={onUpgradeClick}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 font-medium shadow-lg hover:shadow-xl transition-all min-h-[48px] px-6"
      >
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to Premium
      </Button>
    </div>
  );

  return (
    <Card className="bg-slate-800/30 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
            Analytics & Insights
          </div>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPremium ? <PremiumContent /> : <LockedContent />}
      </CardContent>
    </Card>
  );
};