import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MortgageEditDialog } from '../components/mortgage/mortgage-edit-dialog';
import { formatPercentage } from '../utils/mortgage-calculations';

// Mock data for testing
const mockMortgage = {
  id: 1,
  name: "Test Property",
  userId: "test-user",
  propertyValue: "500000",
  mortgageBalance: "400000", 
  interestRate: "0.0725", // 7.25% stored as decimal
  loanTerm: 30,
  startDate: "2025-01-01"
};

describe('Interest Rate Conversion and Formatting', () => {
  let queryClient: QueryClient;
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    mockOnSubmit = vi.fn();
  });

  describe('formatPercentage function', () => {
    it('should format decimal values correctly as percentages', () => {
      expect(formatPercentage(0.07125)).toBe('7.125%');
      expect(formatPercentage(0.065)).toBe('6.500%');
      expect(formatPercentage(0.0025)).toBe('0.250%');
      expect(formatPercentage(0.1)).toBe('10.000%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(0)).toBe('0.000%');
      expect(formatPercentage(1)).toBe('100.000%');
      expect(formatPercentage(0.001)).toBe('0.100%');
    });

    it('should respect decimal places parameter', () => {
      expect(formatPercentage(0.07125, 2)).toBe('7.13%');
      expect(formatPercentage(0.07125, 4)).toBe('7.1250%');
      expect(formatPercentage(0.07125, 0)).toBe('7%');
    });
  });

  it('should display interest rate correctly when editing existing mortgage', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MortgageEditDialog
          isOpen={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          initialData={mockMortgage}
        />
      </QueryClientProvider>
    );

    // Wait for form to load with initial data
    await waitFor(() => {
      const interestRateField = screen.getByDisplayValue('7.25') as HTMLInputElement;
      // Should display 7.25 (percentage form), not 0.0725 (decimal form)
      expect(interestRateField.value).toBe('7.25');
    });
  });

  it('should convert percentage input to decimal correctly when saving', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MortgageEditDialog
          isOpen={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          initialData={null} // Creating new mortgage
        />
      </QueryClientProvider>
    );

    // Fill out the form with a new interest rate
    const nameField = screen.getByLabelText(/Property Name/i);
    const interestRateField = screen.getByLabelText(/Interest Rate/i);
    const saveButton = screen.getByText(/Save Changes/i);

    fireEvent.change(nameField, { target: { value: 'New Property' } });
    fireEvent.change(interestRateField, { target: { value: '6.5' } });
    
    // Submit the form
    fireEvent.click(saveButton);

    // Check that the submitted data has the correct decimal conversion
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          interestRate: 0.065, // 6.5% as decimal, not 0.00065
        })
      );
    });
  });

  it('should handle editing existing rate correctly without double conversion', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MortgageEditDialog
          isOpen={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          initialData={mockMortgage}
        />
      </QueryClientProvider>
    );

    // Wait for form to load
    await waitFor(() => {
      const interestRateField = screen.getByLabelText(/Interest Rate/i);
      expect(interestRateField.value).toBe('7.25');
    });

    // Change the interest rate
    const interestRateField = screen.getByLabelText(/Interest Rate/i);
    fireEvent.change(interestRateField, { target: { value: '5.875' } });
    
    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    // Should convert 5.875% to 0.05875, not to 0.0005875
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          interestRate: 0.05875,
        })
      );
    });
  });

  it('should handle edge cases like 0.25% correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MortgageEditDialog
          isOpen={true}
          onClose={() => {}}
          onSubmit={mockOnSubmit}
          initialData={null}
        />
      </QueryClientProvider>
    );

    const nameField = screen.getByLabelText(/Property Name/i);
    const interestRateField = screen.getByLabelText(/Interest Rate/i);
    
    fireEvent.change(nameField, { target: { value: 'Low Rate Property' } });
    fireEvent.change(interestRateField, { target: { value: '0.25' } });
    
    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          interestRate: 0.0025, // 0.25% as decimal
        })
      );
    });
  });
});