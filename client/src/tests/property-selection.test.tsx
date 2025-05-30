import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '../pages/home-page';
import { AuthProvider } from '../hooks/AuthContext';

// Mock the mortgage API
vi.mock('../api-client/mortgage-api', () => ({
  getMortgages: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "625 West Front Rental",
      userId: "22241360",
      propertyValue: "578000",
      mortgageBalance: "294692",
      interestRate: "0.0275",
      loanTerm: 30,
      startDate: "2021-11-30"
    },
    {
      id: 3,
      name: "212 Pine Place",
      userId: "22241360", 
      propertyValue: "869900",
      mortgageBalance: "677000",
      interestRate: "0.0275",
      loanTerm: 30,
      startDate: "2025-05-30"
    }
  ]),
  createMortgage: vi.fn(),
  updateMortgage: vi.fn(),
  deleteMortgage: vi.fn()
}));

// Mock the auth hook
vi.mock('../hooks/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: "22241360", username: "testuser" },
    isLoading: false,
    isAuthenticated: true
  })
}));

describe('Property Selection Bug', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  it('should load correct property data when selecting from dropdown', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for properties to load
    await screen.findByText(/625 West Front Rental/i);
    
    // Find the property dropdown
    const dropdown = screen.getByDisplayValue(/625 West Front Rental/i);
    expect(dropdown).toBeInTheDocument();

    // Select the second property
    fireEvent.change(dropdown, { target: { value: '3' } });

    // Verify the dropdown shows the correct selection
    expect(dropdown.value).toBe('3');

    // Click edit button to open modal
    const editButton = screen.getByText(/Update payment scenario/i);
    fireEvent.click(editButton);

    // Check that the modal opens with correct property data
    // The name field should show "212 Pine Place", not "625 West Front Rental"
    const nameField = await screen.findByDisplayValue('212 Pine Place');
    expect(nameField).toBeInTheDocument();
    
    // Check other fields to ensure it's the right property
    const propertyValueField = screen.getByDisplayValue('869900');
    expect(propertyValueField).toBeInTheDocument();
  });

  it('should distinguish between creating new property vs editing existing', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for properties to load
    await screen.findByText(/625 West Front Rental/i);

    // Click "Add another property" - should open empty form
    const addButton = screen.getByText(/Add another property/i);
    fireEvent.click(addButton);

    // Check that modal opens with empty fields
    const nameFields = screen.getAllByLabelText(/Property Name/i);
    const nameField = nameFields[0];
    expect(nameField.value).toBe('');

    // Close modal
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    // Now test editing existing property
    const editButton = screen.getByText(/Update payment scenario/i);
    fireEvent.click(editButton);

    // Should show existing property data
    const nameFieldWithData = await screen.findByDisplayValue('625 West Front Rental');
    expect(nameFieldWithData).toBeInTheDocument();
  });
});