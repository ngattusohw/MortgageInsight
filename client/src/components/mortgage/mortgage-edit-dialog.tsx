import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Mortgage } from "@shared/schema";

const mortgageFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  propertyValue: z.string().min(1, "Property value is required").transform(val => Number(val.replace(/[^0-9.]/g, ''))),
  mortgageBalance: z.string().min(1, "Mortgage balance is required").transform(val => Number(val.replace(/[^0-9.]/g, ''))),
  interestRate: z.string().min(1, "Interest rate is required").transform(val => Number(val.replace(/[^0-9.]/g, ''))),
  loanTerm: z.string().min(1, "Loan term is required"),
  startDate: z.string().min(1, "Start date is required"),
});

type MortgageFormValues = z.infer<typeof mortgageFormSchema>;

interface MortgageEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: Mortgage | null;
}

export function MortgageEditDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: MortgageEditDialogProps) {
  const form = useForm<MortgageFormValues>({
    resolver: zodResolver(mortgageFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      propertyValue: Number(initialData.propertyValue).toLocaleString(),
      mortgageBalance: Number(initialData.mortgageBalance).toLocaleString(),
      interestRate: Number(initialData.interestRate).toString(),
      loanTerm: initialData.loanTerm.toString(),
      startDate: new Date(initialData.startDate).toISOString().split('T')[0],
    } : {
      name: "My Primary Home",
      propertyValue: "",
      mortgageBalance: "",
      interestRate: "",
      loanTerm: "30",
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const handleFormSubmit = (data: MortgageFormValues) => {
    onSubmit({
      name: data.name,
      propertyValue: data.propertyValue,
      mortgageBalance: data.mortgageBalance,
      interestRate: data.interestRate,
      loanTerm: parseInt(data.loanTerm),
      startDate: data.startDate,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Mortgage Details" : "Add New Mortgage"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mortgage Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Primary Home" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Value</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input 
                        className="pl-8" 
                        placeholder="500,000" 
                        {...field} 
                        onChange={(e) => {
                          // Format number with commas
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          const formattedValue = value ? Number(value).toLocaleString() : '';
                          field.onChange(formattedValue);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mortgageBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Mortgage Balance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input 
                        className="pl-8" 
                        placeholder="450,000" 
                        {...field} 
                        onChange={(e) => {
                          // Format number with commas
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          const formattedValue = value ? Number(value).toLocaleString() : '';
                          field.onChange(formattedValue);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        className="pr-8" 
                        placeholder="5.75" 
                        {...field} 
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">%</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Term</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a loan term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30">30 years</SelectItem>
                      <SelectItem value="25">25 years</SelectItem>
                      <SelectItem value="20">20 years</SelectItem>
                      <SelectItem value="15">15 years</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? "Save Changes" : "Add Mortgage"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
