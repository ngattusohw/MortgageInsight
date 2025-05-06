import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, Trophy } from "lucide-react";
import { type Mortgage } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateMonthlyPayment,
  calculatePaymentFutureValue,
  calculateOptimalPaymentDistribution,
  formatCurrency,
  formatPercentage,
  MortgageOptimization
} from "@/utils/mortgage-calculations";

interface OptimalPaymentCardProps {
  mortgages: Mortgage[];
  isLoading: boolean;
}

export function OptimalPaymentCard({ mortgages, isLoading }: OptimalPaymentCardProps) {
  const [extraPayment, setExtraPayment] = useState(500);
  const [isCalculating, setIsCalculating] = useState(false);
  const [allocations, setAllocations] = useState<{
    mortgageId: number;
    amount: number;
    futureValue: number;
    roi: number;
  }[]>([]);

  // Calculate payment allocations when extra payment amount changes or mortgages change
  useEffect(() => {
    if (mortgages.length === 0 || extraPayment <= 0) {
      setAllocations([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsCalculating(true);
      
      try {
        // Convert mortgages to optimization data format
        const mortgageOptimizations: MortgageOptimization[] = mortgages.map(mortgage => {
          const interestRate = Number(mortgage.interestRate);
          const yearsRemaining = Number(mortgage.loanTerm);
          
          // Calculate future value of a $1000 payment to determine ROI
          const testPayment = 1000;
          const futureValue = calculatePaymentFutureValue(
            testPayment,
            interestRate / 100,
            yearsRemaining
          );
          
          // Calculate return on investment
          const returnOnInvestment = ((futureValue - testPayment) / testPayment) * 100;
          
          return {
            id: Number(mortgage.id),
            name: mortgage.name,
            futureValue,
            returnOnInvestment,
            interestRate,
            yearsRemaining
          };
        });
        
        // Calculate optimal allocation
        const newAllocations = calculateOptimalPaymentDistribution(
          mortgageOptimizations,
          extraPayment
        );
        
        setAllocations(newAllocations);
      } catch (error) {
        console.error("Error calculating optimal payment distribution:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [mortgages, extraPayment]);

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow overflow-hidden col-span-full">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-6">
            Optimize Extra Payment Across Properties
          </h3>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }
  
  if (mortgages.length <= 1) {
    return null; // Don't show this card if there's only one or no mortgage
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden col-span-full">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800">
              Optimize Extra Payment Across Properties
            </h3>
            <p className="text-sm text-neutral-700">
              Determine the best allocation of your extra payment to maximize savings
            </p>
          </div>
          
          <div className="flex items-center space-x-3 min-w-[200px]">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
              <Input 
                className="pl-8"
                type="text"
                value={extraPayment.toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setExtraPayment(Number(value) || 0);
                }}
              />
            </div>
          </div>
        </div>
        
        {isCalculating ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="ml-3 text-neutral-700">Calculating optimal allocation...</span>
          </div>
        ) : allocations.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Trophy className="h-5 w-5 text-secondary-500 mr-2" />
                <h4 className="text-sm font-medium text-neutral-800">Optimal Allocation</h4>
              </div>
              
              {mortgages.map(mortgage => {
                const allocation = allocations.find(a => a.mortgageId === Number(mortgage.id));
                if (!allocation) return null;
                
                return (
                  <div key={mortgage.id} className="mb-4 last:mb-0">
                    <div className="flex flex-col md:flex-row justify-between mb-2">
                      <div className="font-medium text-neutral-800">{mortgage.name}</div>
                      <div className="flex items-center">
                        <span className="text-sm text-neutral-700 mr-2">
                          {formatPercentage(Number(mortgage.interestRate))} for {mortgage.loanTerm} years
                        </span>
                        <span className="font-semibold text-accent-500">
                          {formatCurrency(allocation.amount)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-700">Future value of this payment:</span>
                      <span className="text-secondary-500 font-medium">
                        {formatCurrency(allocation.futureValue)}
                        <span className="text-neutral-700 font-normal ml-1">
                          ({allocation.roi.toFixed(1)}% ROI)
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-neutral-100 pt-4">
              <p className="text-sm text-neutral-700">
                <span className="font-medium">Payment Strategy:</span> Allocate extra payments to mortgages with the highest return on investment (ROI). 
                Typically, this means prioritizing mortgages with higher interest rates and longer remaining terms.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-50 rounded-lg p-6 text-center">
            <p className="text-neutral-700">Enter an amount above to calculate the optimal payment distribution</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}