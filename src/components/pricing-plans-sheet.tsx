'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
    console.log(`Selected plan: ${plans.find(p => p.id === planId)?.name}`);
  };

  const handlePlanCTA = (planId: string) => {
    const selectedPlanData = plans.find(p => p.id === planId);
    if (selectedPlanData) {
      console.log(`CTA clicked for plan: ${selectedPlanData.name}`);
      setFeedbackMessage(`Thank you for selecting the ${selectedPlanData.name} plan! An API will be connected here soon.`);
      
      setTimeout(() => {
        onClose();
        setSelectedPlan(null);
        setFeedbackMessage(null);
      }, 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-h-[95vh] overflow-hidden p-0 w-full max-w-[98vw] sm:max-w-[90vw] lg:max-w-[85vw]"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('[data-autocomplete-dropdown]')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-gray-100">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 mt-2">
            Select the plan that best fits your school's hiring needs. All plans include AI-powered teacher assessment and comprehensive recruitment tools.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 py-4 sm:py-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col min-h-[500px] ${
                  plan.highlighted
                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 shadow-xl'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg'
                } ${selectedPlan === plan.id ? 'ring-4 ring-purple-400 ring-offset-2 scale-105' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-wide">
                      {plan.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm text-gray-500 font-medium">/{plan.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Features Header */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      What's Included:
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="flex-grow mb-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                            <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                          </div>
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-300 h-12 text-base font-semibold shadow-lg hover:shadow-xl rounded-xl"
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

          {/* Additional Info */}
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900 mb-1">Need Help Choosing?</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Our team is here to help you select the perfect plan for your school. Contact us for a personalized recommendation based on your hiring needs.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feedback Message */}
        {feedbackMessage && (
          <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            <div className="flex items-center justify-center gap-3 text-sm text-green-700 bg-green-50 border border-green-200 p-4 rounded-xl">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{feedbackMessage}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PricingPlansDialog;