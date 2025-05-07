import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MortgageEditDialog } from '../components/mortgage/mortgage-edit-dialog';

describe('MortgageEditDialog Component', () => {
  const mockMortgage = {
    id: 1,
    userId: '123',
    propertyValue: 400000,
    mortgageBalance: 300000,
    interestRate: 0.05,
    monthlyPayment: 1610.46,
    startDate: new Date('2023-01-01'),
    propertyName: 'Test Property',
    loanTerm: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render with correct form fields when creating a new mortgage', () => {
    render(
      <MortgageEditDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialData={null} 
      />
    );

    // Form should render with empty fields
    expect(screen.getByLabelText(/property name/i)).toHaveValue('');
    expect(screen.getByLabelText(/property value/i)).toHaveValue('');
  });

  it('should render with populated form fields when editing existing mortgage', () => {
    render(
      <MortgageEditDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialData={mockMortgage} 
      />
    );

    // Form should be populated with mortgage data
    expect(screen.getByLabelText(/property name/i)).toHaveValue('Test Property');
    expect(screen.getByLabelText(/property value/i)).toHaveValue('400000');
    expect(screen.getByLabelText(/mortgage balance/i)).toHaveValue('300000');
    expect(screen.getByLabelText(/interest rate/i)).toHaveValue('5');
    expect(screen.getByLabelText(/loan term/i)).toHaveValue('30');
  });

  it('should validate form fields and prevent submission with invalid data', async () => {
    render(
      <MortgageEditDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialData={null} 
      />
    );

    // Try to submit with invalid data
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/property name is required/i)).toBeInTheDocument();
    });

    // onSubmit should not be called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with form data when submitted with valid data', async () => {
    render(
      <MortgageEditDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialData={null} 
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/property name/i), {
      target: { value: 'New Property' },
    });
    fireEvent.change(screen.getByLabelText(/property value/i), {
      target: { value: '350000' },
    });
    fireEvent.change(screen.getByLabelText(/mortgage balance/i), {
      target: { value: '280000' },
    });
    fireEvent.change(screen.getByLabelText(/interest rate/i), {
      target: { value: '4.5' },
    });
    fireEvent.change(screen.getByLabelText(/monthly payment/i), {
      target: { value: '1500' },
    });
    fireEvent.change(screen.getByLabelText(/loan term/i), {
      target: { value: '30' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    // onSubmit should be called with the form data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        propertyName: 'New Property',
        propertyValue: 350000,
        mortgageBalance: 280000,
        interestRate: 0.045, // Converted from percentage to decimal
        monthlyPayment: 1500,
        loanTerm: 30
      }));
    });
  });

  it('should close the dialog when cancel button is clicked', () => {
    render(
      <MortgageEditDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialData={null} 
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle initialData=null properly', () => {
    render(
      <MortgageEditDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
        initialData={null} 
      />
    );

    // Form should render with default values
    expect(screen.getByLabelText(/property name/i)).toHaveValue('');
    expect(screen.getByLabelText(/property value/i)).toHaveValue('');
    expect(screen.getByLabelText(/mortgage balance/i)).toHaveValue('');
    expect(screen.getByLabelText(/interest rate/i)).toHaveValue('');
    expect(screen.getByLabelText(/monthly payment/i)).toHaveValue('');
    expect(screen.getByLabelText(/loan term/i)).toHaveValue('30'); // Default
  });
});