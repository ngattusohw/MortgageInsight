import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MortgageEditDialog } from '@/components/mortgage/mortgage-edit-dialog';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock toast component
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('MortgageEditDialog', () => {
  // Set up common test props
  const onSubmitMock = vi.fn();
  const onCloseMock = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for creating a new mortgage', async () => {
    render(
      <MortgageEditDialog
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        initialData={null}
      />
    );

    // Check if the dialog title is "Add New Property"
    expect(screen.getByText('Add New Property')).toBeInTheDocument();
    
    // Check if form fields are empty
    expect(screen.getByLabelText(/Property Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Property Value/i)).toHaveValue('');
    expect(screen.getByLabelText(/Mortgage Balance/i)).toHaveValue('');
    expect(screen.getByLabelText(/Interest Rate/i)).toHaveValue('');
    expect(screen.getByLabelText(/Loan Term/i)).toHaveValue('30');
    
    // Today's date should be set as default
    const today = new Date().toISOString().split('T')[0];
    expect(screen.getByLabelText(/Start Date/i)).toHaveValue(today);
  });

  it('renders correctly with initial data for editing', async () => {
    const mockMortgage = {
      id: 1,
      userId: 'user123',
      name: 'Test Property',
      propertyValue: '500000',
      mortgageBalance: '400000',
      interestRate: '0.04',
      loanTerm: 30,
      startDate: '2023-01-01',
    };

    render(
      <MortgageEditDialog
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        initialData={mockMortgage}
      />
    );

    // Check if the dialog title is "Edit Property"
    expect(screen.getByText('Edit Property')).toBeInTheDocument();
    
    // Check if form fields have the correct initial values
    expect(screen.getByLabelText(/Property Name/i)).toHaveValue('Test Property');
    expect(screen.getByLabelText(/Property Value/i)).toHaveValue('500000');
    expect(screen.getByLabelText(/Mortgage Balance/i)).toHaveValue('400000');
    expect(screen.getByLabelText(/Interest Rate/i)).toHaveValue('4');
    expect(screen.getByLabelText(/Loan Term/i)).toHaveValue('30');
    expect(screen.getByLabelText(/Start Date/i)).toHaveValue('2023-01-01');
  });

  it('submits form with correct values when creating a new mortgage', async () => {
    const user = userEvent.setup();
    
    render(
      <MortgageEditDialog
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        initialData={null}
      />
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/Property Name/i), 'New Test Property');
    await user.type(screen.getByLabelText(/Property Value/i), '600000');
    await user.type(screen.getByLabelText(/Mortgage Balance/i), '550000');
    await user.type(screen.getByLabelText(/Interest Rate/i), '3.5');
    
    // Select loan term
    await user.click(screen.getByLabelText(/Loan Term/i));
    await user.selectOptions(screen.getByLabelText(/Loan Term/i), '15');
    
    // Set start date
    const startDateInput = screen.getByLabelText(/Start Date/i);
    fireEvent.change(startDateInput, { target: { value: '2023-05-15' } });
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Add Property/i }));
    
    // Wait for the form to be submitted
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });
    
    // Check the submitted values
    expect(onSubmitMock).toHaveBeenCalledWith({
      name: 'New Test Property',
      propertyValue: 600000,
      mortgageBalance: 550000,
      interestRate: 0.035,
      loanTerm: 15,
      startDate: '2023-05-15',
    });
  });

  it('submits form with correct values when updating an existing mortgage', async () => {
    const user = userEvent.setup();
    
    const mockMortgage = {
      id: 1,
      userId: 'user123',
      name: 'Original Property',
      propertyValue: '500000',
      mortgageBalance: '400000',
      interestRate: '0.04',
      loanTerm: 30,
      startDate: '2023-01-01',
    };
    
    render(
      <MortgageEditDialog
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        initialData={mockMortgage}
      />
    );

    // Clear and update the property name
    const nameInput = screen.getByLabelText(/Property Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Property');
    
    // Clear and update the property value
    const valueInput = screen.getByLabelText(/Property Value/i);
    await user.clear(valueInput);
    await user.type(valueInput, '525000');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Update Property/i }));
    
    // Wait for the form to be submitted
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });
    
    // Check the submitted values - should include all fields, not just the changed ones
    expect(onSubmitMock).toHaveBeenCalledWith({
      name: 'Updated Property',
      propertyValue: 525000,
      mortgageBalance: 400000,
      interestRate: 0.04,
      loanTerm: 30,
      startDate: '2023-01-01',
    });
  });

  it('validates required fields and displays errors', async () => {
    const user = userEvent.setup();
    
    render(
      <MortgageEditDialog
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        initialData={null}
      />
    );

    // Submit the form without filling out required fields
    await user.click(screen.getByRole('button', { name: /Add Property/i }));
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/Property name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Property value is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Mortgage balance is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Interest rate is required/i)).toBeInTheDocument();
    });
    
    // Ensure onSubmit wasn't called
    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('closes the dialog when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MortgageEditDialog
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        initialData={null}
      />
    );

    // Click the cancel button
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    
    // Check that onClose was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});