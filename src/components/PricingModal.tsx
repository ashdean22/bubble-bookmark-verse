import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Circle, Star, Crown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: (bubbleCount: number, tier?: string) => void;
}

interface PricingTier {
  id: string;
  name: string;
  bubbles: number;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  icon: React.ReactNode;
  features: string[];
}

export const PricingModal = ({ isOpen, onClose, onPurchaseComplete }: PricingModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Bubble Free',
      bubbles: 3,
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: <Circle className="w-6 h-6" />,
      features: ['3 floating bubbles', 'Basic animations', 'Auto favicon detection', 'Mobile app access', 'Community support']
    },
    {
      id: 'basic',
      name: 'Bubble Basic',
      bubbles: 50,
      monthlyPrice: 1.99,
      yearlyPrice: 19.99,
      icon: <Circle className="w-6 h-6" />,
      features: ['50 floating bubbles', 'Enhanced animations', 'Cloud sync', 'Priority loading', 'Email support']
    },
    {
      id: 'popular',
      name: 'Bubble Pro',
      bubbles: 75,
      monthlyPrice: 4.99,
      yearlyPrice: 39.99,
      popular: true,
      icon: <Star className="w-6 h-6" />,
      features: ['75 floating bubbles', 'Heat visualization (hot/cold)', '6 Premium theme packs', 'Custom color schemes', 'Advanced visual effects', 'Theme presets library', 'Export/import bookmarks', 'Priority sync', 'Priority support']
    },
    {
      id: 'premium',
      name: 'Bubble Premium',
      bubbles: 999,
      monthlyPrice: 7.99,
      yearlyPrice: 65.99,
      icon: <Crown className="w-6 h-6" />,
      features: ['Unlimited bubbles', 'Heat visualization (hot/cold)', 'Unlimited custom themes', 'Advanced theme designer', 'Animated theme effects', 'Seasonal theme updates', 'Brand-specific themes', 'Team collaboration', 'Advanced analytics', 'API access', 'White-label options', 'VIP support']
    }
  ];

  const getSavings = (tier: PricingTier) => {
    const monthlyCost = tier.monthlyPrice * 12;
    const yearlyCost = tier.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  const handlePurchase = async (tier: PricingTier) => {
    setIsProcessing(true);
    setProcessingTier(tier.id);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would integrate with Stripe
      // For demo purposes, we'll simulate a successful purchase
      onPurchaseComplete(tier.bubbles, tier.id);
      onClose();
      
      toast({
        title: "Bubbles delivered! 🎉",
        description: `${tier.bubbles} fresh bubbles have been added to your bubble universe!`,
      });
    } catch (error) {
      toast({
        title: "Bubble delivery failed",
        description: "Something went wrong with your bubble order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingTier(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl bg-slate-900 border-purple-500/30 max-h-[85vh] overflow-hidden font-body p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-2xl mb-2 font-brand font-bold flex items-center justify-center gap-2">
            <Circle className="w-6 h-6 text-purple-400" />
            Choose Your Plan
            <Circle className="w-4 h-4 text-pink-400" />
          </DialogTitle>
          <p className="text-purple-300 text-center font-body">
            Unlock your bubble universe with flexible pricing plans 🫧
          </p>
        </DialogHeader>
        
        
        <ScrollArea className="w-full mt-4 sm:mt-6">
          <div className="flex md:grid md:grid-cols-4 gap-4 sm:gap-6 pb-4 px-1">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative bg-slate-800/50 border transition-all duration-300 hover:scale-105 min-w-[260px] sm:min-w-[280px] md:min-w-0 flex-shrink-0 ${
                  tier.popular 
                    ? 'border-purple-400 shadow-lg shadow-purple-500/20' 
                    : 'border-purple-500/30 hover:border-purple-400'
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-brand font-medium">
                    Most Bubbly
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-purple-600'
                  } text-white shadow-lg`}>
                    {tier.icon}
                  </div>
                  
                  <CardTitle className="text-white text-xl font-brand font-semibold">{tier.name}</CardTitle>
                  <CardDescription className="text-purple-300 font-body">
                    {tier.bubbles === 999 ? 'Unlimited' : tier.bubbles} floating bubbles
                  </CardDescription>
                  
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="text-purple-300 text-sm flex items-center font-body">
                        <Circle className="w-4 h-4 mr-2 text-purple-400 fill-current" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {tier.monthlyPrice === 0 ? (
                    <Button
                      onClick={() => handlePurchase(tier)}
                      disabled={isProcessing}
                      className="w-full font-body font-medium shadow-lg hover:shadow-xl transition-all min-h-[48px] bg-slate-700 hover:bg-slate-600 border border-purple-500/30 text-white"
                    >
                      {processingTier === tier.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Bubbles...
                        </>
                      ) : (
                        'Get Started Free'
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* Monthly Option */}
                      <div className="p-3 rounded-lg bg-slate-700/50 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-300 text-sm font-body">Monthly</span>
                          <span className="text-white font-brand font-bold">${tier.monthlyPrice.toFixed(2)}/mo</span>
                        </div>
                        <Button
                          onClick={() => {
                            setBillingCycle('monthly');
                            handlePurchase(tier);
                          }}
                          disabled={isProcessing}
                          className={`w-full font-body font-medium shadow-lg hover:shadow-xl transition-all min-h-[44px] ${
                            tier.popular
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                              : 'bg-purple-600 hover:bg-purple-700'
                          } text-white`}
                        >
                          {processingTier === tier.id && billingCycle === 'monthly' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Buy Monthly'
                          )}
                        </Button>
                      </div>
                      
                      {/* Yearly Option */}
                      <div className="p-3 rounded-lg bg-slate-700/50 border border-green-500/30 relative">
                        <Badge className="absolute -top-2 right-2 bg-green-600 text-white text-xs">
                          Save ${getSavings(tier).toFixed(0)}
                        </Badge>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-purple-300 text-sm font-body">Yearly</span>
                          <span className="text-white font-brand font-bold">${tier.yearlyPrice.toFixed(2)}/yr</span>
                        </div>
                        <div className="text-green-400 text-xs mb-2 font-body">
                          ${(tier.yearlyPrice / 12).toFixed(2)}/mo billed annually
                        </div>
                        <Button
                          onClick={() => {
                            setBillingCycle('yearly');
                            handlePurchase(tier);
                          }}
                          disabled={isProcessing}
                          className={`w-full font-body font-medium shadow-lg hover:shadow-xl transition-all min-h-[44px] ${
                            tier.popular
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {processingTier === tier.id && billingCycle === 'yearly' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Buy Yearly'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-800/30 rounded-lg border border-purple-500/20">
          <p className="text-purple-300 text-xs sm:text-sm font-body">
            🫧 Monthly subscription • 🔒 Cancel anytime • ✨ Instant plan activation
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
