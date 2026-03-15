import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, TrendingUp, Eye, Clock, Crown, Lock,
  Share2, Copy, Check, Flame, Users
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Bookmark } from '@/pages/Index';

interface AnalyticsInsightsProps {
  bookmarks: Bookmark[];
  currentSubscription: string | null;
  onUpgradeClick: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatLastAccessed(ts?: number): string {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/**
 * Heat color: mirrors BubbleCanvas heat system.
 * heat=1 → red (hue 0°)  |  heat=0 → blue (hue 210°)
 */
function getHeatColor(accessCount: number, maxAccess: number) {
  const heat = maxAccess > 0 ? Math.min(accessCount / maxAccess, 1) : 0;
  const hue = Math.round(210 - heat * 210);
  const sat = Math.round(65 + heat * 20);
  const lit = Math.round(55 - heat * 10);
  return {
    base:   `hsla(${hue},${sat}%,${lit}%,0.85)`,
    glow:   `hsla(${hue},${sat}%,${lit + 25}%,0.35)`,
    text:   `hsla(${hue},${sat}%,${lit + 25}%,1)`,
    border: `hsla(${hue},${sat}%,${lit + 15}%,0.5)`,
    hue,
    sat,
    lit,
    heat,
  };
}

/** Returns the last-7-days access count grouped by day label */
function buildTrendData(history?: number[]) {
  const days: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), count: 0 });
  }
  if (!history) return days;
  const weekAgo = Date.now() - 7 * 86_400_000;
  history.forEach(ts => {
    if (ts < weekAgo) return;
    const dayIndex = 6 - Math.floor((Date.now() - ts) / 86_400_000);
    if (dayIndex >= 0 && dayIndex <= 6) days[dayIndex].count++;
  });
  return days;
}

function buildAllTrendData(bookmarks: Bookmark[]) {
  return buildTrendData(bookmarks.flatMap(b => b.accessHistory || []));
}

// ─── subcomponents ─────────────────────────────────────────────────────────────

const TrendMiniChart = ({
  history,
  maxAccess,
  accessCount,
}: {
  history?: number[];
  maxAccess: number;
  accessCount: number;
}) => {
  const data = buildTrendData(history);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const heat = maxAccess > 0 ? Math.min(accessCount / maxAccess, 1) : 0;
  const hue = Math.round(210 - heat * 210);
  const sat = Math.round(65 + heat * 20);
  const lit = Math.round(50 - heat * 10);
  return (
    <ResponsiveContainer width="100%" height={40}>
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsla(${hue},${sat}%,${lit + (data[i].count / maxCount) * 20}%,0.9)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const FullTrendChart = ({ bookmarks }: { bookmarks: Bookmark[] }) => {
  const data = buildAllTrendData(bookmarks);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const overallHeat = Math.min(total / (bookmarks.length * 5 + 1), 1);
  const hue = Math.round(210 - overallHeat * 210);
  const sat = Math.round(65 + overallHeat * 20);
  const lit = Math.round(50 - overallHeat * 10);
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--card-foreground))' }}
          cursor={{ fill: `hsla(${hue},${sat}%,${lit + 30}%,0.08)` }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsla(${hue},${sat}%,${lit + (data[i].count / maxCount) * 20}%,0.85)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const ShareRow = ({ bookmark }: { bookmark: Bookmark }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}?shared=${encodeURIComponent(bookmark.url)}&title=${encodeURIComponent(bookmark.title)}`;
  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const sharedCount = bookmark.sharedBy?.length ?? 0;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'hsla(270,30%,20%,0.5)' }}>
      <div className="flex items-center gap-3 min-w-0">
        {bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="w-5 h-5 rounded flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
        ) : (
          <div className="w-5 h-5 rounded flex-shrink-0" style={{ background: 'hsla(270,60%,50%,0.4)' }} />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{bookmark.title}</p>
          {sharedCount > 0 && (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Shared with {sharedCount} friend{sharedCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={copy} className="flex-shrink-0 gap-1 text-xs px-2 h-7" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied!' : 'Share'}
      </Button>
    </div>
  );
};

// ─── main premium content ──────────────────────────────────────────────────────

const PremiumContent = ({
  bookmarks,
  onUpgradeClick: _onUpgradeClick,
}: {
  bookmarks: Bookmark[];
  onUpgradeClick: () => void;
}) => {
  const totalClicks = bookmarks.reduce((s, b) => s + b.accessCount, 0);
  const averageClicks = bookmarks.length > 0 ? Math.round((totalClicks / bookmarks.length) * 10) / 10 : 0;
  const unusedBubbles = bookmarks.filter(b => b.accessCount === 0).length;
  const sorted = [...bookmarks].sort((a, b) => b.accessCount - a.accessCount);
  const trending = sorted.slice(0, 5);
  const maxAccess = sorted[0]?.accessCount ?? 0;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareTab, setShareTab] = useState(false);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Eye className="w-4 h-4" style={{ color: 'hsla(270,70%,70%,1)' }} />, label: 'Total Interactions', value: totalClicks, sub: 'All-time clicks' },
          { icon: <TrendingUp className="w-4 h-4" style={{ color: 'hsla(145,70%,50%,1)' }} />, label: 'Avg Usage', value: averageClicks, sub: 'Per bubble' },
          { icon: <BarChart3 className="w-4 h-4" style={{ color: 'hsla(190,70%,55%,1)' }} />, label: 'Active Bubbles', value: bookmarks.length - unusedBubbles, sub: 'With interactions' },
          { icon: <Clock className="w-4 h-4" style={{ color: 'hsla(40,90%,60%,1)' }} />, label: 'Unused Bubbles', value: unusedBubbles, sub: 'Never clicked' },
        ].map(card => (
          <Card key={card.label} className="border" style={{ background: 'hsla(270,30%,12%,0.7)', borderColor: 'hsla(270,50%,50%,0.25)' }}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.icon}{card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{card.value}</div>
              <p className="text-xs mt-0.5" style={{ color: 'hsla(270,60%,70%,0.8)' }}>{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heat colour legend */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Heat:</span>
        <div className="flex-1 h-2.5 rounded-full" style={{ background: 'linear-gradient(to right, hsla(210,65%,55%,0.9), hsla(105,70%,50%,0.9), hsla(0,80%,52%,0.9))' }} />
        <span className="text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>🥶 Cold</span>
        <span className="text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>🔥 Hot</span>
      </div>

      {/* Overall 7-day trend */}
      <Card className="border" style={{ background: 'hsla(270,30%,12%,0.7)', borderColor: 'hsla(270,50%,50%,0.25)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'hsla(270,70%,70%,1)' }} />
            Overall Usage — Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FullTrendChart bookmarks={bookmarks} />
        </CardContent>
      </Card>

      {/* Top performing bubbles with heat styling */}
      <Card className="border" style={{ background: 'hsla(270,30%,12%,0.7)', borderColor: 'hsla(270,50%,50%,0.25)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <Flame className="w-4 h-4" style={{ color: 'hsla(30,90%,60%,1)' }} />
            Top Performing Bubbles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trending.map((bookmark, index) => {
              const heat = getHeatColor(bookmark.accessCount, maxAccess);
              return (
                <div key={bookmark.id}>
                  <button
                    className="w-full text-left p-3 rounded-lg transition-all"
                    style={{
                      background: expandedId === bookmark.id
                        ? `hsla(${heat.hue},35%,22%,0.7)`
                        : `hsla(${heat.hue},25%,15%,0.6)`,
                      borderLeft: `3px solid ${heat.base}`,
                      boxShadow: expandedId === bookmark.id ? `0 0 12px ${heat.glow}` : 'none',
                    }}
                    onClick={() => setExpandedId(expandedId === bookmark.id ? null : bookmark.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank circle coloured by heat */}
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
                          style={{ background: heat.base, boxShadow: `0 0 8px ${heat.glow}` }}
                        >
                          {index + 1}
                        </div>
                        {bookmark.favicon && (
                          <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded flex-shrink-0"
                            onError={e => (e.currentTarget.style.display = 'none')} />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{bookmark.title}</p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Last opened: {formatLastAccessed(bookmark.lastAccessed)}
                          </p>
                        </div>
                      </div>
                      {/* Click badge coloured by heat */}
                      <Badge
                        className="ml-2 flex-shrink-0 text-white border-0 text-xs"
                        style={{ background: heat.base, boxShadow: `0 0 6px ${heat.glow}` }}
                      >
                        {bookmark.accessCount} clicks
                      </Badge>
                    </div>
                  </button>
                  {expandedId === bookmark.id && (
                    <div className="px-3 pb-3 rounded-b-lg -mt-1 pt-2"
                      style={{ background: `hsla(${heat.hue},30%,14%,0.6)` }}>
                      <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>7-day trend</p>
                      <TrendMiniChart
                        history={bookmark.accessHistory}
                        maxAccess={maxAccess}
                        accessCount={bookmark.accessCount}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {trending.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No bubbles yet. Start clicking to see analytics!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share / Trending tab */}
      <Card className="border" style={{ background: 'hsla(270,30%,12%,0.7)', borderColor: 'hsla(270,50%,50%,0.25)' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Users className="w-4 h-4" style={{ color: 'hsla(200,80%,60%,1)' }} />
              Share Bubbles
            </CardTitle>
            <div className="flex rounded-md overflow-hidden text-xs border" style={{ borderColor: 'hsla(270,50%,40%,0.4)' }}>
              {['Share', 'Trending'].map(tab => (
                <button key={tab} onClick={() => setShareTab(tab === 'Trending')}
                  className="px-3 py-1 transition-colors"
                  style={{
                    background: (shareTab ? tab === 'Trending' : tab === 'Share') ? 'hsla(270,60%,40%,0.8)' : 'transparent',
                    color: (shareTab ? tab === 'Trending' : tab === 'Share') ? 'white' : 'hsl(var(--muted-foreground))',
                  }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!shareTab ? (
            <div className="space-y-2">
              <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Copy a shareable link for any bubble to send to friends.
              </p>
              {bookmarks.slice(0, 6).map(b => <ShareRow key={b.id} bookmark={b} />)}
              {bookmarks.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Add bubbles to start sharing!</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Your most-clicked bubbles — your personal trending list.
              </p>
              {sorted.slice(0, 5).map((b, i) => {
                const heat = getHeatColor(b.accessCount, maxAccess);
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: `hsla(${heat.hue},25%,15%,0.6)`,
                      borderLeft: `3px solid ${heat.base}`,
                    }}>
                    <span className="text-base font-bold w-6 text-center flex-shrink-0" style={{ color: heat.text }}>
                      {i === 0 ? '🔥' : `#${i + 1}`}
                    </span>
                    {b.favicon && (
                      <img src={b.favicon} alt="" className="w-5 h-5 rounded flex-shrink-0"
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{b.title}</p>
                      <p className="text-xs" style={{ color: heat.text }}>{b.accessCount} total opens</p>
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <TrendMiniChart history={b.accessHistory} maxAccess={maxAccess} accessCount={b.accessCount} />
                    </div>
                  </div>
                );
              })}
              {sorted.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No activity yet!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── locked content ────────────────────────────────────────────────────────────

const LockedContent = ({ onUpgradeClick }: { onUpgradeClick: () => void }) => (
  <div className="text-center py-12 px-6">
    <div className="relative w-20 h-20 mx-auto mb-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: 'linear-gradient(135deg, hsla(270,70%,55%,1), hsla(320,70%,55%,1))' }}>
        <Lock className="w-10 h-10 text-white" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, hsla(40,90%,60%,1), hsla(25,90%,55%,1))' }}>
        <Crown className="w-4 h-4 text-white" />
      </div>
    </div>
    <h3 className="text-2xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Analytics & Insights</h3>
    <p className="mb-6 max-w-md mx-auto" style={{ color: 'hsla(270,60%,75%,0.9)' }}>
      Unlock detailed analytics, usage trends, heat maps and sharing features.
    </p>
    <div className="border rounded-lg p-6 mb-6 max-w-md mx-auto"
      style={{ background: 'hsla(270,30%,14%,0.7)', borderColor: 'hsla(270,50%,50%,0.25)' }}>
      <h4 className="font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>Premium Analytics Include:</h4>
      <ul className="text-sm space-y-2 text-left" style={{ color: 'hsla(270,60%,75%,0.9)' }}>
        {([
          [<Clock className="w-4 h-4" style={{ color: 'hsla(40,90%,60%,1)' }} />, 'Last accessed timestamps'],
          [<TrendingUp className="w-4 h-4" style={{ color: 'hsla(145,70%,50%,1)' }} />, '7-day usage trend graphs'],
          [<BarChart3 className="w-4 h-4" style={{ color: 'hsla(190,70%,55%,1)' }} />, 'Performance rankings'],
          [<Share2 className="w-4 h-4" style={{ color: 'hsla(200,80%,60%,1)' }} />, 'Share bubbles with friends'],
          [<Flame className="w-4 h-4" style={{ color: 'hsla(30,90%,60%,1)' }} />, '🔥 Hot / 🥶 Cold heat colour system'],
        ] as [React.ReactNode, string][]).map(([icon, label], i) => (
          <li key={i} className="flex items-center gap-2">{icon}{label}</li>
        ))}
      </ul>
    </div>
    <Button onClick={onUpgradeClick}
      className="text-white border-0 font-medium shadow-lg hover:shadow-xl transition-all min-h-[48px] px-6"
      style={{ background: 'linear-gradient(135deg, hsla(270,70%,55%,1), hsla(320,70%,55%,1))' }}>
      <Crown className="w-4 h-4 mr-2" />
      Upgrade to Premium
    </Button>
  </div>
);

// ─── root export ───────────────────────────────────────────────────────────────

export const AnalyticsInsights = ({ bookmarks, currentSubscription, onUpgradeClick }: AnalyticsInsightsProps) => {
  const isPremium = currentSubscription === 'premium';
  return (
    <Card className="border" style={{ background: 'hsla(270,30%,10%,0.6)', borderColor: 'hsla(270,50%,50%,0.25)', backdropFilter: 'blur(12px)' }}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between" style={{ color: 'hsl(var(--foreground))' }}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: 'hsla(270,70%,70%,1)' }} />
            Analytics & Insights
          </div>
          {isPremium && (
            <Badge className="text-white border-0"
              style={{ background: 'linear-gradient(135deg, hsla(270,70%,55%,1), hsla(320,70%,55%,1))' }}>
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPremium
          ? <PremiumContent bookmarks={bookmarks} onUpgradeClick={onUpgradeClick} />
          : <LockedContent onUpgradeClick={onUpgradeClick} />}
      </CardContent>
    </Card>
  );
};
