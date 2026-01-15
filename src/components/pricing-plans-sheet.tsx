'use client';

import React, { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
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
    badge: 'Most Popular',
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
    highlighted: true
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

const PricingPlansSheet: React.FC<PricingPlansSheetProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setFeedbackMessage(`You have selected the ${plans.find(p => p.id === planId)?.name} plan!`);
  };

  const handleNext = () => {
    if (!selectedPlan) {
      setFeedbackMessage('Please select a plan first!');
      return;
    }
    
    // Show feedback and simulate API call
    const selectedPlanName = plans.find(p => p.id === selectedPlan)?.name;
    setFeedbackMessage(`Thank you for selecting the ${selectedPlanName} plan! An API will be connected here soon.`);
    
    // Close the sheet after a short delay
    setTimeout(() => {
      onClose();
      setSelectedPlan(null);
    }, 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-y-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Choose Your Plan</SheetTitle>
        </SheetHeader>
        
       <div className="py-6 flex-1 overflow-y-auto">
          <div className="flex gap-4 px-1 min-w-max">
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
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-purple-600 text-white px-3 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap shadow">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className={`p-6 ${plan.highlighted ? 'pt-7' : 'pt-6'}`}>
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

                  {/* Price and Button */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">/{plan.period}</span>
                      )}
                    </div>
                    
                    <Button 
                      className={`w-full ${
                        selectedPlan === plan.id 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : plan.highlighted 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : plan.id === 'platinum'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan.id);
                      }}
                    >
                      {selectedPlan === plan.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            </div>
        
        <div className="border-t p-6 bg-background sticky bottom-0 mt-auto">
          <SheetFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedPlan}
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PricingPlansSheet;