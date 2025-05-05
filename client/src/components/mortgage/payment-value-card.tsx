import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lightbulb } from "lucide-react";
import { type Mortgage } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateAmortizationSchedule,
  calculateAmortizationWithLumpSum,
  formatCurrency
} from "@/utils/mortgage-calculations";

interface PaymentValueCardProps {
  mortgage: Mortgage | null;
}

export function PaymentValueCard({ mortgage }: PaymentValueCardProps) {
  const [principalPayment, setPrincipalPayment] = useState(10000);
  const [displayMode, setDisplayMode] = useState<"dollars" | "percentage">("dollars");
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<{
    interestSaved: number;
    timeYearsSaved: number;
    returnOnInvestment: number;
    totalSavings: number;
  } | null>(null);

  const handleCalculate = () => {
    if (!mortgage) return;
    
    setIsCalculating(true);
    
    // Run the calculation on the next tick to allow the UI to update
    setTimeout(() => {
      // Original amortization schedule
      const originalSchedule = calculateAmortizationSchedule(
        Number(mortgage.mortgageBalance),
        Number(mortgage.interestRate) / 100,
        Number(mortgage.loanTerm)
      );
      
      // Calculate total interest to be paid
      const originalTotalInterest = originalSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      
      // Calculate schedule with lump sum payment
      const scheduleWithLumpSum = calculateAmortizationWithLumpSum(
        Number(mortgage.mortgageBalance),
        Number(mortgage.interestRate) / 100,
        Number(mortgage.loanTerm),
        principalPayment
      );
      
      // Calculate total interest with lump sum payment
      const newTotalInterest = scheduleWithLumpSum.reduce((sum, year) => sum + year.yearlyInterest, 0);
      
      // Calculate the interest saved
      const interestSaved = originalTotalInterest - newTotalInterest;
      
      // Calculate time saved
      const originalYears = originalSchedule.length;
      const newYears = scheduleWithLumpSum.length;
      const timeYearsSaved = originalYears - newYears;
      
      // Calculate return on investment
      const returnOnInvestment = (interestSaved / principalPayment) * 100;
      
      setResults({
        interestSaved,
        timeYearsSaved,
        returnOnInvestment,
        totalSavings: principalPayment + interestSaved
      });
      
      setIsCalculating(false);
    }, 100);
  };

  if (!mortgage) {
    return (
      <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-1">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-6">Early Payment Value</h3>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-1">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-6">Early Payment Value</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-neutral-700">Principal Payment</h4>
              <div className="flex items-center">
                <Button 
                  size="sm"
                  variant={displayMode === "dollars" ? "default" : "outline"}
                  className={`text-sm ${displayMode === "dollars" ? "text-white" : "text-neutral-700"} px-2 py-1 h-8 rounded-md mr-2`}
                  onClick={() => setDisplayMode("dollars")}
                >
                  $
                </Button>
                <Button 
                  size="sm"
                  variant={displayMode === "percentage" ? "default" : "outline"}
                  className={`text-sm ${displayMode === "percentage" ? "text-white" : "text-neutral-700"} px-2 py-1 h-8 rounded-md`}
                  onClick={() => setDisplayMode("percentage")}
                >
                  %
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-3 mb-4">
              {displayMode === "dollars" ? (
                <div className="flex-grow relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                  <Input 
                    className="pl-8"
                    type="text"
                    value={principalPayment.toLocaleString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPrincipalPayment(Number(value) || 0);
                    }}
                  />
                </div>
              ) : (
                <div className="flex-grow relative">
                  <Input 
                    className="pr-8"
                    type="number"
                    value={Math.round((principalPayment / Number(mortgage.mortgageBalance)) * 10000) / 100}
                    onChange={(e) => {
                      const percentage = parseFloat(e.target.value) || 0;
                      const amount = (percentage / 100) * Number(mortgage.mortgageBalance);
                      setPrincipalPayment(Math.round(amount));
                    }}
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">%</span>
                </div>
              )}
              <Button 
                className="bg-primary-500 hover:bg-primary-600 text-white" 
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Calculate"}
              </Button>
            </div>
            
            <div className="bg-neutral-50 rounded-md p-4 mb-4">
              <p className="text-sm text-neutral-700 mb-2">Making a {formatCurrency(principalPayment)} principal payment today:</p>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-accent-500">
                  {results ? formatCurrency(results.totalSavings) : "--"}
                </p>
                <p className="text-sm text-neutral-700 ml-2">total savings</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm text-neutral-700 mb-2">
                <span>Interest saved:</span>
                <span className="font-medium text-neutral-800">
                  {results ? formatCurrency(results.interestSaved) : "--"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-neutral-700 mb-2">
                <span>Time saved:</span>
                <span className="font-medium text-neutral-800">
                  {results ? `${Math.floor(results.timeYearsSaved)}.${Math.round((results.timeYearsSaved % 1) * 10)} years` : "--"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-neutral-700">
                <span>Return on investment:</span>
                <span className="font-medium text-secondary-500">
                  {results ? `${Math.round(results.returnOnInvestment)}%` : "--"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center mb-4">
              <Lightbulb className="h-5 w-5 text-secondary-500 mr-2" />
              <h4 className="text-sm font-medium text-neutral-800">Payment Tip</h4>
            </div>
            <p className="text-sm text-neutral-700">Making additional principal payments early in your loan term provides the greatest savings due to amortization.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
