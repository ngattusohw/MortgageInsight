import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Mortgage, type Scenario } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateAmortizationSchedule,
  calculateAmortizationWithExtraPayment,
  formatCurrency
} from "@/utils/mortgage-calculations";

interface ScenariosCardProps {
  scenarios: Scenario[];
  mortgage: Mortgage | null;
  onCreateScenario: (data: Omit<Scenario, 'id' | 'mortgageId'>) => void;
  onUpdateScenario: (id: number, data: Partial<Scenario>) => void;
}

const scenarioFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  additionalMonthlyPayment: z.number().min(0, "Must be 0 or greater"),
  biWeeklyPayments: z.boolean(),
  annualLumpSum: z.number().min(0, "Must be 0 or greater"),
  isActive: z.boolean(),
});

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>;

export function ScenariosCard({ scenarios, mortgage, onCreateScenario, onUpdateScenario }: ScenariosCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      name: "New Scenario",
      additionalMonthlyPayment: 0,
      biWeeklyPayments: false,
      annualLumpSum: 0,
      isActive: true,
    },
  });
  
  const handleFormSubmit = (data: ScenarioFormValues) => {
    onCreateScenario({
      name: data.name,
      additionalMonthlyPayment: data.additionalMonthlyPayment,
      biWeeklyPayments: data.biWeeklyPayments ? 1 : 0,
      annualLumpSum: data.annualLumpSum,
      isActive: data.isActive ? 1 : 0,
    });
    setIsDialogOpen(false);
    form.reset();
  };
  
  const handleSetActive = (id: number) => {
    onUpdateScenario(id, { isActive: 1 });
  };

  if (!mortgage) {
    return (
      <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Payment Scenarios</h3>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate original total payments
  const originalSchedule = calculateAmortizationSchedule(
    Number(mortgage.mortgageBalance),
    Number(mortgage.interestRate) / 100,
    Number(mortgage.loanTerm)
  );
  
  const originalMonthlyPayment = Number(mortgage.mortgageBalance) * 
    (Number(mortgage.interestRate) / 100 / 12) * 
    Math.pow(1 + Number(mortgage.interestRate) / 100 / 12, Number(mortgage.loanTerm) * 12) / 
    (Math.pow(1 + Number(mortgage.interestRate) / 100 / 12, Number(mortgage.loanTerm) * 12) - 1);
  
  const originalTotalPayments = originalMonthlyPayment * 12 * Number(mortgage.loanTerm);

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">Payment Scenarios</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => setIsDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            New Scenario
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard Payment Scenario */}
          <div className="border border-neutral-100 rounded-md p-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-medium text-neutral-800">Standard Payment</h4>
              <span className={`text-xs ${scenarios.length === 0 || scenarios.some(s => s.isActive === 1) ? 'bg-neutral-100 text-neutral-700' : 'bg-primary-100 text-primary-700'} px-2 py-1 rounded`}>
                {scenarios.length === 0 || scenarios.some(s => s.isActive === 1) ? 'Base' : 'Active'}
              </span>
            </div>
            <p className="text-sm text-neutral-700 mb-3">Regular payments without additional principal</p>
            <div className="mb-4">
              <p className="text-xs text-neutral-700">Total payments</p>
              <p className="text-lg font-semibold text-neutral-800">{formatCurrency(originalTotalPayments)}</p>
            </div>
          </div>
          
          {/* User Scenarios */}
          {scenarios.map((scenario) => {
            // Calculate total payments with this scenario
            let scheduleWithScenario;
            let totalPayments = originalTotalPayments;
            
            if (scenario.additionalMonthlyPayment) {
              scheduleWithScenario = calculateAmortizationWithExtraPayment(
                Number(mortgage.mortgageBalance),
                Number(mortgage.interestRate) / 100,
                Number(mortgage.loanTerm),
                Number(scenario.additionalMonthlyPayment)
              );
              
              // Calculate total payments with additional payments
              const yearsWithExtraPayment = scheduleWithScenario.length;
              const regularPayments = originalMonthlyPayment * 12 * yearsWithExtraPayment;
              const extraPayments = Number(scenario.additionalMonthlyPayment) * 12 * yearsWithExtraPayment;
              totalPayments = regularPayments + extraPayments;
            }
            
            return (
              <div key={scenario.id} className="border border-neutral-100 rounded-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-neutral-800">{scenario.name}</h4>
                  {scenario.isActive === 1 ? (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">Active</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary h-6 px-2"
                      onClick={() => handleSetActive(scenario.id)}
                    >
                      Set Active
                    </Button>
                  )}
                </div>
                <p className="text-sm text-neutral-700 mb-3">
                  {scenario.additionalMonthlyPayment ? 
                    `Adding $${scenario.additionalMonthlyPayment} to monthly payment` : 
                    "Custom payment plan"}
                </p>
                <div className="mb-4">
                  <p className="text-xs text-neutral-700">Total payments</p>
                  <p className="text-lg font-semibold text-neutral-800">{formatCurrency(totalPayments)}</p>
                </div>
                <div className="flex justify-end">
                  <Button variant="link" size="sm" className="text-primary h-6 p-0">
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
          
          {/* Empty state - add a few placeholder scenarios if none exist */}
          {scenarios.length === 0 && (
            <>
              <div className="border border-neutral-100 rounded-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-neutral-800">$500 Extra Monthly</h4>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">Recommended</span>
                </div>
                <p className="text-sm text-neutral-700 mb-3">Example: Adding $500 to monthly payment</p>
                <div className="mb-4">
                  <p className="text-xs text-neutral-700">Total payments</p>
                  <p className="text-lg font-semibold text-neutral-800">--</p>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-primary h-6 p-0"
                    onClick={() => {
                      onCreateScenario({
                        name: "$500 Extra Monthly",
                        additionalMonthlyPayment: 500,
                        biWeeklyPayments: 0,
                        annualLumpSum: 0,
                        isActive: 1,
                      });
                    }}
                  >
                    Create Scenario
                  </Button>
                </div>
              </div>
              
              <div className="border border-neutral-100 rounded-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-neutral-800">Bi-weekly Payments</h4>
                </div>
                <p className="text-sm text-neutral-700 mb-3">Example: Paying half the monthly amount every two weeks</p>
                <div className="mb-4">
                  <p className="text-xs text-neutral-700">Total payments</p>
                  <p className="text-lg font-semibold text-neutral-800">--</p>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-primary h-6 p-0"
                    onClick={() => {
                      onCreateScenario({
                        name: "Bi-weekly Payments",
                        additionalMonthlyPayment: Math.round(originalMonthlyPayment * 26 / 12 - originalMonthlyPayment),
                        biWeeklyPayments: 1,
                        annualLumpSum: 0,
                        isActive: 0,
                      });
                    }}
                  >
                    Create Scenario
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      {/* New Scenario Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Payment Scenario</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="additionalMonthlyPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Monthly Payment</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input 
                          className="pl-8" 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="biWeeklyPayments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Bi-Weekly Payments</FormLabel>
                      <p className="text-sm text-muted-foreground">Make payments every two weeks instead of monthly</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="annualLumpSum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Lump Sum Payment</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input 
                          className="pl-8" 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Set as Active Scenario</FormLabel>
                      <p className="text-sm text-muted-foreground">Use this scenario for calculations on the dashboard</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Scenario</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
