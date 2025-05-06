import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MortgageDetailsCard } from "@/components/mortgage/mortgage-details-card";
import { MortgageEditDialog } from "@/components/mortgage/mortgage-edit-dialog";
import { PaymentImpactCard } from "@/components/mortgage/payment-impact-card";
import { AmortizationCard } from "@/components/mortgage/amortization-card";
import { ScenariosCard } from "@/components/mortgage/scenarios-card";
import { PaymentValueCard } from "@/components/mortgage/payment-value-card";
import { OptimalPaymentCard } from "@/components/mortgage/optimal-payment-card";
import { type Mortgage, type Scenario } from "@shared/schema";
import { Loader2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function HomePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMortgageId, setSelectedMortgageId] = useState<number | null>(
    null,
  );
  const [additionalPayment, setAdditionalPayment] = useState(500);
  const { toast } = useToast();

  // Fetch mortgages
  const { data: mortgages, isLoading: isMortgagesLoading } = useQuery<
    Mortgage[]
  >({
    queryKey: ["/api/mortgages"],
    staleTime: 60000, // 1 minute
    onSuccess: (data) => {
      console.log("Mortgages loaded:", data);
      console.log("Number of mortgages:", data?.length);
    },
  });

  // Fetch scenarios for the selected mortgage
  const { data: scenarios, isLoading: isScenariosLoading } = useQuery<
    Scenario[]
  >({
    queryKey: ["/api/mortgages", selectedMortgageId, "scenarios"],
    enabled: !!selectedMortgageId,
    staleTime: 60000,
  });

  // Select the first mortgage by default
  useEffect(() => {
    if (mortgages?.length && !selectedMortgageId) {
      setSelectedMortgageId(mortgages[0].id);
    }
  }, [mortgages, selectedMortgageId]);

  // Get the currently selected mortgage
  const selectedMortgage =
    mortgages?.find((m) => m.id === selectedMortgageId) || null;

  // Get the active scenario
  const activeScenario = scenarios?.find((s) => s.isActive === 1);

  // Create mortgage mutation
  const createMortgageMutation = useMutation({
    mutationFn: async (data: Omit<Mortgage, "id" | "userId">) => {
      const res = await apiRequest("POST", "/api/mortgages", data);
      return res.json();
    },
    onSuccess: (newMortgage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mortgages"] });
      // Set the newly created mortgage as the selected one
      setSelectedMortgageId(newMortgage.id);
      toast({
        title: "Mortgage created",
        description: "Your mortgage has been successfully created.",
      });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create mortgage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mortgage mutation
  const updateMortgageMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Mortgage>;
    }) => {
      const res = await apiRequest("PUT", `/api/mortgages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mortgages"] });
      toast({
        title: "Mortgage updated",
        description: "Your mortgage has been successfully updated.",
      });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update mortgage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMortgageSubmit = (data: any) => {
    if (selectedMortgageId) {
      updateMortgageMutation.mutate({ id: selectedMortgageId, data });
    } else {
      createMortgageMutation.mutate(data);
    }
  };

  // Update scenario mutation
  const updateScenarioMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Scenario>;
    }) => {
      const res = await apiRequest("PUT", `/api/scenarios/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      if (selectedMortgageId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/mortgages", selectedMortgageId, "scenarios"],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async ({
      mortgageId,
      data,
    }: {
      mortgageId: number;
      data: Omit<Scenario, "id" | "mortgageId">;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/mortgages/${mortgageId}/scenarios`,
        data,
      );
      return res.json();
    },
    onSuccess: () => {
      if (selectedMortgageId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/mortgages", selectedMortgageId, "scenarios"],
        });
      }
      toast({
        title: "Scenario created",
        description: "Your payment scenario has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create scenario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAdditionalPaymentChange = (amount: number) => {
    setAdditionalPayment(amount);

    if (
      activeScenario &&
      Number(activeScenario.additionalMonthlyPayment) !== amount
    ) {
      updateScenarioMutation.mutate({
        id: activeScenario.id,
        data: { additionalMonthlyPayment: amount.toString() },
      });
    } else if (selectedMortgageId && !activeScenario) {
      createScenarioMutation.mutate({
        mortgageId: selectedMortgageId,
        data: {
          name: `$${amount} Extra Monthly`,
          additionalMonthlyPayment: amount.toString(),
          isActive: 1,
          biWeeklyPayments: 0,
          annualLumpSum: "0",
        },
      });
    }
  };

  if (isMortgagesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-medium">
              Loading your mortgage data...
            </h2>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!mortgages?.length) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-10">
              <Home className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                No Mortgages Found
              </h2>
              <p className="text-neutral-600 mb-6">
                Get started by adding your first mortgage details to see how you
                can save with early payments.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  setSelectedMortgageId(null);
                  setIsEditModalOpen(true);
                }}
              >
                Add Your First Mortgage
              </Button>
            </div>
          </div>
        </main>
        <Footer />

        <MortgageEditDialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleMortgageSubmit}
          initialData={null}
        />
      </div>
    );
  }

  // Debug information about mortgage lengths and condition
  console.log("Before rendering - mortgages array:", mortgages);
  console.log("Mortgages length:", mortgages?.length);
  console.log("Should show selector:", mortgages && mortgages.length > 1);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />

      <main className="flex-grow">
        {/* Debug Property Selector - Always visible */}
        {mortgages && mortgages.length >= 1 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-yellow-100">
            <div className="mb-2">
              <label
                htmlFor="property-select-debug"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Debug Property Selector ({mortgages.length} properties)
              </label>
              <select
                id="property-select-debug"
                className="w-full md:w-64 rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedMortgageId || ""}
                onChange={(e) =>
                  setSelectedMortgageId(Number(e.target.value))
                }
              >
                {mortgages.map((mortgage) => (
                  <option key={mortgage.id} value={mortgage.id}>
                    {mortgage.name} (ID: {mortgage.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Banner and Property Selector */}
          <div className="bg-primary-50 rounded-lg p-6 mb-8">
            <div className="md:flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-800 font-sans mb-2">
                  Welcome back!
                </h2>
                <p className="text-neutral-700 mb-4">
                  See how much you can save by making additional principal
                  payments on your mortgage.
                </p>

                {/* Property Selector - Only shows when there are multiple properties */}
                {mortgages && mortgages.length > 1 && (
                  <div className="mb-4">
                    <label
                      htmlFor="property-select"
                      className="block text-sm font-medium text-neutral-700 mb-1"
                    >
                      Select Property
                    </label>
                    <select
                      id="property-select"
                      className="w-full md:w-64 rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={selectedMortgageId || ""}
                      onChange={(e) =>
                        setSelectedMortgageId(Number(e.target.value))
                      }
                    >
                      {mortgages.map((mortgage) => (
                        <option key={mortgage.id} value={mortgage.id}>
                          {mortgage.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="default"
                    className="bg-accent-500 hover:bg-accent-600 text-white"
                    onClick={() => {
                      setIsEditModalOpen(true);
                    }}
                  >
                    Update payment scenario
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMortgageId(null);
                      setIsEditModalOpen(true);
                    }}
                  >
                    Add another property
                  </Button>
                </div>
              </div>
              <div className="mt-6 md:mt-0">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                  alt="Home illustration"
                  className="w-full md:w-64 h-auto rounded-md shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mortgage Details Card */}
            <MortgageDetailsCard
              mortgage={selectedMortgage}
              onEditClick={() => setIsEditModalOpen(true)}
            />

            {/* Payment Impact Card */}
            <PaymentImpactCard
              mortgage={selectedMortgage}
              additionalPayment={additionalPayment}
              onAdditionalPaymentChange={handleAdditionalPaymentChange}
            />

            {/* Amortization Schedule Card */}
            <AmortizationCard
              mortgage={selectedMortgage}
              additionalPayment={additionalPayment}
            />

            {/* Scenarios Comparison Card */}
            <ScenariosCard
              scenarios={scenarios || []}
              mortgage={selectedMortgage}
              onCreateScenario={(data) => {
                if (selectedMortgageId) {
                  createScenarioMutation.mutate({
                    mortgageId: selectedMortgageId,
                    data,
                  });
                }
              }}
              onUpdateScenario={(id, data) => {
                updateScenarioMutation.mutate({ id, data });
              }}
            />

            {/* Payment Value Card */}
            <PaymentValueCard mortgage={selectedMortgage} />

            {/* Optimal Payment Card - Only shows when there are multiple mortgages */}
            {mortgages && mortgages.length > 1 && (
              <OptimalPaymentCard
                mortgages={mortgages}
                isLoading={isMortgagesLoading}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />

      <MortgageEditDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleMortgageSubmit}
        initialData={selectedMortgage}
      />
    </div>
  );
}
