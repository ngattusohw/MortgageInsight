import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { type Mortgage } from "@shared/schema";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateAmortizationSchedule,
  calculateAmortizationWithExtraPayment,
  formatCurrency,
  formatDate
} from "@/utils/mortgage-calculations";
import Chart from "chart.js/auto";

interface PaymentImpactCardProps {
  mortgage: Mortgage | null;
  additionalPayment: number;
  onAdditionalPaymentChange: (payment: number) => void;
}

export function PaymentImpactCard({ mortgage, additionalPayment, onAdditionalPaymentChange }: PaymentImpactCardProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "ytd">("ytd");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart<"line"> | null>(null);

  // Update chart when mortgage or additional payment changes
  useEffect(() => {
    if (!mortgage) return;
    
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
    
    // Calculate totals
    const originalTotalInterest = originalSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
    const newTotalInterest = newSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
    const interestSaved = originalTotalInterest - newTotalInterest;
    
    // Calculate years saved
    const originalYears = originalSchedule.length;
    const newYears = newSchedule.length;
    const yearsSaved = originalYears - newYears;
    
    // Get new payoff date
    const startDate = new Date(mortgage.startDate);
    const originalPayoffDate = new Date(startDate);
    originalPayoffDate.setFullYear(originalPayoffDate.getFullYear() + originalYears);
    
    const newPayoffDate = new Date(startDate);
    newPayoffDate.setFullYear(newPayoffDate.getFullYear() + newYears);
    
    // Create labels for chart (years)
    const years = Array.from({ length: originalYears }, (_, i) => {
      const date = new Date(startDate);
      date.setFullYear(date.getFullYear() + i);
      return date.getFullYear().toString();
    });
    
    // Create datasets for chart
    const originalBalances = originalSchedule.map(year => year.endingBalance);
    const newBalances = [...newSchedule.map(year => year.endingBalance)];
    
    // Pad new balances with zeros if shorter than original
    while (newBalances.length < originalBalances.length) {
      newBalances.push(0);
    }
    
    // Create or update chart
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Original Balance',
              data: originalBalances,
              borderColor: 'rgb(25, 118, 210)',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'With Extra Payments',
              data: newBalances,
              borderColor: 'rgb(56, 142, 60)',
              backgroundColor: 'rgba(56, 142, 60, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += formatCurrency(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatCurrency(value as number);
                }
              }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [mortgage, additionalPayment]);

  const handleSliderChange = (value: number[]) => {
    onAdditionalPaymentChange(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    onAdditionalPaymentChange(Number(value) || 0);
  };

  if (!mortgage) {
    return (
      <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Payment Impact Visualization</h3>
            <div className="mt-2 sm:mt-0">
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
          
          <div className="h-[300px] mb-6 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          
          <div className="border-t border-neutral-100 pt-6">
            <Skeleton className="h-6 w-48 mb-3" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate savings information
  const originalSchedule = calculateAmortizationSchedule(
    Number(mortgage.mortgageBalance),
    Number(mortgage.interestRate) / 100,
    Number(mortgage.loanTerm)
  );
  
  const newSchedule = calculateAmortizationWithExtraPayment(
    Number(mortgage.mortgageBalance),
    Number(mortgage.interestRate) / 100,
    Number(mortgage.loanTerm),
    additionalPayment
  );
  
  const originalTotalInterest = originalSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
  const newTotalInterest = newSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
  const interestSaved = originalTotalInterest - newTotalInterest;
  
  const originalYears = originalSchedule.length;
  const newYears = newSchedule.length;
  const yearsSaved = originalYears - newYears;
  const monthsSaved = (originalYears - newYears) * 12;
  
  const startDate = new Date(mortgage.startDate);
  const newPayoffDate = new Date(startDate);
  newPayoffDate.setFullYear(newPayoffDate.getFullYear() + newYears);

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">Payment Impact Visualization</h3>
          <div className="mt-2 sm:mt-0 flex">
            <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(value) => setViewMode(value as "monthly" | "ytd")}>
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="ytd">Year to Date</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="h-[300px] mb-6">
          <canvas ref={chartRef}></canvas>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-primary-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-neutral-700 mb-1">Total Interest Saved</h4>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(interestSaved)}</p>
            <p className="text-xs text-neutral-700 mt-1">With additional principal payments</p>
          </div>
          
          <div className="bg-secondary-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-neutral-700 mb-1">
              {yearsSaved > 0
                ? `${Math.floor(yearsSaved)} years, ${Math.round((yearsSaved % 1) * 12)} months saved`
                : "Time Saved"}
            </h4>
            <p className="text-2xl font-bold text-secondary-600">
              {yearsSaved > 0
                ? `${Math.floor(yearsSaved)}.${Math.round((yearsSaved % 1) * 10)} years`
                : "0 years"}
            </p>
            <p className="text-xs text-neutral-700 mt-1">
              New payoff date: {formatDate(newPayoffDate)}
            </p>
          </div>
        </div>
        
        <div className="border-t border-neutral-100 pt-6">
          <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center">
            Additional principal payment
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Extra payments applied directly to your principal balance can significantly reduce your total interest paid.
              </TooltipContent>
            </Tooltip>
          </h4>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-grow">
              <Slider
                value={[additionalPayment]}
                min={0}
                max={2000}
                step={25}
                className="w-full"
                onValueChange={handleSliderChange}
              />
            </div>
            <div className="w-full sm:w-32">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                <Input
                  className="pl-8 text-right"
                  value={additionalPayment}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-neutral-700 mb-2">
              Adding ${additionalPayment} monthly to your principal payment is worth:
            </p>
            <p className="text-2xl font-bold text-accent-500">
              {formatCurrency(Math.round(interestSaved / (additionalPayment * 12 * newYears) * additionalPayment))}
              <span className="text-sm font-normal text-neutral-700 ml-2">
                in future savings
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
