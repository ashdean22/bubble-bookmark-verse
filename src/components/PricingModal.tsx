
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sparkles, Star, Crown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: (bubbleCount: number) => void;
}

interface PricingTier {
  id: string;
  name: string;
  bubbles: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  icon: React.ReactNode;
  features: string[];
}

export const PricingModal = ({ isOpen, onClose, onPurchaseComplete }: PricingModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const { toast } = useToast();

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      bubbles: 10,
      price: 4.99,
      icon: <Sparkles className="w-6 h-6" />,
      features: ['10 bubble bookmarks', 'Basic animations', 'Favicon auto-detection']
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      bubbles: 20,
      price: 14.99,
      originalPrice: 19.99,
      popular: true,
      icon: <Star className="w-6 h-6" />,
      features: ['20 bubble bookmarks', 'Enhanced animations', 'Favicon auto-detection', 'Priority support']
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      bubbles: 50,
      price: 24.99,
      originalPrice: 34.99,
      icon: <Crown className="w-6 h-6" />,
      features: ['50 bubble bookmarks', 'Premium animations', 'Favicon auto-detection', 'Priority support', 'Future features included']
    }
  ];

  const handlePurchase = async (tier: PricingTier) => {
    setIsProcessing(true);
    setProcessingTier(tier.id);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would integrate with Stripe
      // For demo purposes, we'll simulate a successful purchase
      onPurchaseComplete(tier.bubbles);
      onClose();
      
      toast({
        title: "Purchase successful! 🎉",
        description: `${tier.bubbles} bubbles have been added to your account!`,
      });
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingTier(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-slate-900 border-purple-500/30 max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-2xl mb-2">
            Choose Your Bubble Pack
          </DialogTitle>
          <p className="text-purple-300 text-center">
            Expand your bookmark universe with more bubbles
          </p>
        </DialogHeader>
        
        <ScrollArea className="w-full mt-6">
          <div className="flex md:grid md:grid-cols-3 gap-6 pb-4">
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
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-purple-600'
                  } text-white`}>
                    {tier.icon}
                  </div>
                  
                  <CardTitle className="text-white text-xl">{tier.name}</CardTitle>
                  <CardDescription className="text-purple-300">
                    {tier.bubbles} bubble bookmarks
                  </CardDescription>
                  
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    {tier.originalPrice && (
                      <span className="text-slate-400 line-through text-lg">
                        ${tier.originalPrice}
                      </span>
                    )}
                    <span className="text-white text-3xl font-bold">
                      ${tier.price}
                    </span>
                  </div>
                  
                  {tier.originalPrice && (
                    <Badge variant="secondary" className="bg-green-600 text-white mt-2">
                      Save ${(tier.originalPrice - tier.price).toFixed(2)}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="text-purple-300 text-sm flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handlePurchase(tier)}
                    disabled={isProcessing}
                    className={`w-full ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        : 'bg-purple-600 hover:bg-purple-700'
                    } text-white`}
                  >
                    {processingTier === tier.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Get ${tier.bubbles} Bubbles`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <div className="text-center mt-6 p-4 bg-slate-800/30 rounded-lg border border-purple-500/20">
          <p className="text-purple-300 text-sm">
            💳 Secure payment processing • 🔒 No subscription required • ✨ Instant delivery
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
