'use client';

import React, { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  badge: string | null;
  features: string[];
  cta: string;
  highlighted: boolean;
}

interface PricingPlansSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans: PricingPlan[] = [
  {
    id: 'bronze',
    name: 'BRONZE',
    price: '₹12,500',
    period: 'per job',
    description: 'Pay as you go - perfect for occasional hiring',
    badge: null,
    features: [
      '1 Job posting (Pay per job)',
      'Review up to 50 teacher applications',
      '1 admin user access',
      'Standard AI Teacher Assessment',
      'Basic proctoring capabilities',
      'AI-powered demo evaluation',
      'Interview scheduling tool'
    ],
    cta: 'Get Bronze',
    highlighted: false
  },
  {
    id: 'silver',
    name: 'SILVER',
    price: '₹50,000',
    period: 'per year',
    description: 'Best for smaller schools with fewer vacancies',
    badge: null,
    features: [
      '5 Job postings per year',
      'Review up to 100 applications per job',
      '1 admin user access',
      'Enhanced AI Teacher Assessment',
      'Standard proctoring capabilities',
      'Advanced AI demo evaluation',
      'Interview scheduling tool',
      'Basic selection recommendations'
    ],
    cta: 'Get Silver',
    highlighted: false
  },
  {
    id: 'gold',
    name: 'GOLD',
    price: '₹75,000',
    period: 'per year',
    description: 'Perfect for mid-sized schools',
    badge: null,
    features: [
      '10 Job postings per year',
      'Review up to 200 applications per job',
      '2 admin users access',
      'Comprehensive AI Assessment Suite',
      'Advanced proctoring capabilities',
      'Premium AI demo evaluation',
      'Priority interview scheduling',
      'Smart selection recommendations'
    ],
    cta: 'Get Gold',
    highlighted: false
  },
  {
    id: 'platinum',
    name: 'PLATINUM',
    price: '₹2,50,000',
    period: 'per year',
    description: 'Ideal for school groups with 5+ schools',
    badge: null,
    features: [
      '50 Job postings per year',
      'Review up to 200 applications per job',
      '5 admin users access',
      'Enterprise AI Assessment Suite',
      'Enterprise proctoring capabilities',
      'Advanced AI demo evaluation',
      'Priority interview scheduling',
      'AI-powered selection recommendations'
    ],
    cta: 'Get Platinum',
    highlighted: false
  }
];

const PricingPlansDialog: React.FC<PricingPlansSheetProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Handle plan selection - you can add your logic here
    console.log(`Selected plan: ${plans.find(p => p.id === planId)?.name}`);
  };

  const handlePlanCTA = (planId: string) => {
    const selectedPlanData = plans.find(p => p.id === planId);
    if (selectedPlanData) {
      // Handle the CTA action - this is where you'd connect to your API
      console.log(`CTA clicked for plan: ${selectedPlanData.name}`);
      setFeedbackMessage(`Thank you for selecting the ${selectedPlanData.name} plan! An API will be connected here soon.`);
      
      // Close the dialog after a short delay
      setTimeout(() => {
        onClose();
        setSelectedPlan(null);
        setFeedbackMessage(null);
      }, 2000);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 w-full max-w-[98vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex gap-4 min-w-max">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border transition-all duration-200 cursor-pointer w-[240px] flex-shrink-0 ${
                  plan.highlighted
                    ? 'border-purple-300 dark:border-purple-500 bg-white dark:bg-[#161B22] shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161B22] hover:border-gray-300 dark:hover:border-gray-600'
                } ${selectedPlan === plan.id ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {/* Removed badge since it conflicts with design requirements */}

                <div className="p-6 flex flex-col justify-between h-full">
                  <div>
                    {/* Plan Name */}
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {plan.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                        {plan.description}
                      </p>
                    </div>

                    {/* Features Header */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Unlock these features:
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      <ul className="space-y-2">
                        {plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                            <span className="leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Price and Button - Aligned at bottom */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">/{plan.period}</span>
                      )}
                    </div>
                    
                    <Button 
                      className={`w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 transition-all duration-200 ease-in-out h-10 px-4 py-2 border-0 shadow-none`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanCTA(plan.id);
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Feedback message */}
        {feedbackMessage && (
          <div className="px-6 pb-6">
            <div className="text-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              {feedbackMessage}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PricingPlansDialog;