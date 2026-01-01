import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      bubbles: 25,
      monthlyPrice: 1.99,
      yearlyPrice: 19.99,
      icon: <Circle className="w-6 h-6" />,
      features: ['25 floating bubbles', 'Enhanced animations', 'Cloud sync', 'Priority loading', 'Email support']
    },
    {
      id: 'popular',
      name: 'Bubble Pro',
      bubbles: 75,
      monthlyPrice: 4.99,
      yearlyPrice: 39.99,
      popular: true,
      icon: <Star className="w-6 h-6" />,
      features: ['75 floating bubbles', '6 Premium theme packs', 'Custom color schemes', 'Advanced visual effects', 'Theme presets library', 'Export/import bookmarks', 'Priority sync', 'Priority support']
    },
    {
      id: 'premium',
      name: 'Bubble Premium',
      bubbles: 999,
      monthlyPrice: 7.99,
      yearlyPrice: 65.99,
      icon: <Crown className="w-6 h-6" />,
      features: ['Unlimited bubbles', 'Unlimited custom themes', 'Advanced theme designer', 'Animated theme effects', 'Seasonal theme updates', 'Brand-specific themes', 'Team collaboration', 'Advanced analytics', 'API access', 'White-label options', 'VIP support']
    }
  ];

  const getCurrentPrice = (tier: PricingTier) => {
    return billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
  };

  const getMonthlyEquivalent = (tier: PricingTier) => {
    return billingCycle === 'yearly' ? (tier.yearlyPrice / 12).toFixed(2) : tier.monthlyPrice.toFixed(2);
  };

  const getSavings = (tier: PricingTier) => {
    if (billingCycle === 'yearly') {
      const monthlyCost = tier.monthlyPrice * 12;
      const yearlyCost = tier.yearlyPrice;
      return monthlyCost - yearlyCost;
    }
    return 0;
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
      <DialogContent className="sm:max-w-4xl bg-slate-900 border-purple-500/30 max-h-[90vh] overflow-hidden font-body">
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
        
        {/* Billing Toggle */}
        <div className="flex justify-center mt-6">
          <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')} className="w-auto">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-purple-500/30">
              <TabsTrigger value="monthly" className="text-purple-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-purple-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white relative">
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-1 py-0.5">
                  Save up to 33%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <ScrollArea className="w-full mt-6">
          <div className="flex md:grid md:grid-cols-4 gap-6 pb-4">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative bg-slate-800/50 border transition-all duration-300 hover:scale-105 min-w-[280px] md:min-w-0 ${
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
                  
                   <div className="flex flex-col items-center space-y-2 mt-4">
                     <div className="flex items-center space-x-2">
                       <span className="text-white text-3xl font-brand font-bold">
                         {tier.monthlyPrice === 0 ? 'Free' : `$${getCurrentPrice(tier).toFixed(2)}`}
                       </span>
                       {tier.monthlyPrice > 0 && (
                         <span className="text-purple-300 text-lg font-body">
                           {billingCycle === 'yearly' ? '/year' : '/mo'}
                         </span>
                       )}
                     </div>
                     
                     {billingCycle === 'yearly' && tier.monthlyPrice > 0 && (
                       <div className="text-center">
                         <div className="text-purple-300 text-sm font-body">
                           ${getMonthlyEquivalent(tier)}/mo when billed annually
                         </div>
                         {getSavings(tier) > 0 && (
                           <Badge className="bg-green-600 text-white mt-1 font-body font-medium">
                             Save ${getSavings(tier).toFixed(2)} per year
                           </Badge>
                         )}
                       </div>
                     )}
                   </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="text-purple-300 text-sm flex items-center font-body">
                        <Circle className="w-4 h-4 mr-2 text-purple-400 fill-current" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                   <Button
                     onClick={() => handlePurchase(tier)}
                     disabled={isProcessing}
                     className={`w-full font-body font-medium shadow-lg hover:shadow-xl transition-all ${
                       tier.monthlyPrice === 0 
                         ? 'bg-slate-700 hover:bg-slate-600 border border-purple-500/30'
                         : tier.popular
                         ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                         : 'bg-purple-600 hover:bg-purple-700'
                     } text-white`}
                   >
                     {processingTier === tier.id ? (
                       <>
                         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                         Creating Bubbles...
                       </>
                     ) : tier.monthlyPrice === 0 ? (
                       'Get Started Free'
                     ) : (
                       `Start ${tier.name}`
                     )}
                   </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <div className="text-center mt-6 p-4 bg-slate-800/30 rounded-lg border border-purple-500/20">
          <p className="text-purple-300 text-sm font-body">
            🫧 Monthly subscription • 🔒 Cancel anytime • ✨ Instant plan activation
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
