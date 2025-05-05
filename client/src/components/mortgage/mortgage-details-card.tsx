import React from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Mortgage } from "@shared/schema";
import { calculateMonthlyPayment, formatCurrency, formatDate } from "@/utils/mortgage-calculations";

interface MortgageDetailsCardProps {
  mortgage: Mortgage | null;
  onEditClick: () => void;
}

export function MortgageDetailsCard({ mortgage, onEditClick }: MortgageDetailsCardProps) {
  const monthlyPayment = mortgage ? calculateMonthlyPayment(
    Number(mortgage.mortgageBalance),
    Number(mortgage.interestRate) / 100,
    Number(mortgage.loanTerm)
  ) : 0;
  
  const payoffDate = mortgage ? new Date(mortgage.startDate) : new Date();
  if (mortgage) {
    payoffDate.setFullYear(payoffDate.getFullYear() + Number(mortgage.loanTerm));
  }

  if (!mortgage) {
    return (
      <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-1">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Mortgage Details</h3>
            <Button variant="ghost" size="icon" onClick={onEditClick} disabled>
              <Edit className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-7 w-48" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-1">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">{mortgage.name}</h3>
          <Button variant="ghost" size="icon" onClick={onEditClick}>
            <Edit className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-neutral-700 font-medium mb-1">Property Value</p>
            <p className="text-xl font-semibold text-neutral-800">{formatCurrency(Number(mortgage.propertyValue))}</p>
          </div>
          
          <div>
            <p className="text-sm text-neutral-700 font-medium mb-1">Current Mortgage Balance</p>
            <p className="text-xl font-semibold text-neutral-800">{formatCurrency(Number(mortgage.mortgageBalance))}</p>
          </div>
          
          <div>
            <p className="text-sm text-neutral-700 font-medium mb-1">Interest Rate</p>
            <p className="text-xl font-semibold text-neutral-800">{Number(mortgage.interestRate).toFixed(2)}%</p>
          </div>
          
          <div>
            <p className="text-sm text-neutral-700 font-medium mb-1">Loan Term</p>
            <p className="text-xl font-semibold text-neutral-800">{mortgage.loanTerm} years</p>
          </div>
          
          <div>
            <p className="text-sm text-neutral-700 font-medium mb-1">Monthly Payment</p>
            <p className="text-xl font-semibold text-neutral-800">{formatCurrency(monthlyPayment)}</p>
          </div>
          
          <div>
            <p className="text-sm text-neutral-700 font-medium mb-1">Payoff Date</p>
            <p className="text-xl font-semibold text-neutral-800">{formatDate(payoffDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
