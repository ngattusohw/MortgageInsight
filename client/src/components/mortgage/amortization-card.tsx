import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Mortgage } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateAmortizationSchedule,
  calculateAmortizationWithExtraPayment,
  formatCurrency
} from "@/utils/mortgage-calculations";

interface AmortizationCardProps {
  mortgage: Mortgage | null;
  additionalPayment: number;
}

export function AmortizationCard({ mortgage, additionalPayment }: AmortizationCardProps) {
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  if (!mortgage) {
    return (
      <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-3">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">Amortization Schedule</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="text-center">
            <Skeleton className="h-10 w-64 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Original amortization schedule
  const originalSchedule = calculateAmortizationSchedule(
    Number(mortgage.mortgageBalance),
    Number(mortgage.interestRate),
    Number(mortgage.loanTerm)
  );
  
  // Schedule with extra payments
  const newSchedule = calculateAmortizationWithExtraPayment(
    Number(mortgage.mortgageBalance),
    Number(mortgage.interestRate),
    Number(mortgage.loanTerm),
    additionalPayment
  );
  
  // Display only first 5 years by default
  const displayOriginalSchedule = showFullSchedule ? originalSchedule : originalSchedule.slice(0, 5);
  const displayNewSchedule = showFullSchedule ? newSchedule : newSchedule.slice(0, 5);

  // Get starting year from mortgage start date
  const startDate = new Date(mortgage.startDate);
  const startYear = startDate.getFullYear();

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-3">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Amortization Schedule</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Original Schedule</h4>
            <ScrollArea className="h-64">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-100">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Year</th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Balance</th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Principal</th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Interest</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-100">
                    {displayOriginalSchedule.map((year, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{startYear + index}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(year.endingBalance)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(year.yearlyPrincipal)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(year.yearlyInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3">With Additional Payments</h4>
            <ScrollArea className="h-64">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-100">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Year</th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Balance</th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Principal</th>
                      <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Interest</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-100">
                    {displayNewSchedule.map((year, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{startYear + index}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(year.endingBalance)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(year.yearlyPrincipal)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">{formatCurrency(year.yearlyInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <div className="text-center">
          <Button
            variant="link"
            className="text-primary font-medium"
            onClick={() => setShowFullSchedule(!showFullSchedule)}
          >
            {showFullSchedule ? "Show Less" : "View Complete Amortization Schedule"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
