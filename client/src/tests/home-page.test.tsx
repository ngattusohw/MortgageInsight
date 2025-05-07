import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '@/pages/home-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock necessary dependencies and components
vi.mock('@/components/layout/header', () => ({
  Header: () => <div data-testid="mock-header">Header Component</div>,
}));

vi.mock('@/components/layout/footer', () => ({
  Footer: () => <div data-testid="mock-footer">Footer Component</div>,
}));

vi.mock('@/components/mortgage/mortgage-details-card', () => ({
  MortgageDetailsCard: ({ mortgage, onEditClick }) => (
    <div data-testid="mortgage-details-card">
      <div>Property Name: {mortgage?.name}</div>
      <button onClick={onEditClick}>Edit Property</button>
    </div>
  ),
}));

vi.mock('@/components/mortgage/payment-impact-card', () => ({
  PaymentImpactCard: () => <div data-testid="payment-impact-card">Payment Impact Card</div>,
}));

vi.mock('@/components/mortgage/amortization-card', () => ({
  AmortizationCard: () => <div data-testid="amortization-card">Amortization Card</div>,
}));

vi.mock('@/components/mortgage/scenarios-card', () => ({
  ScenariosCard: () => <div data-testid="scenarios-card">Scenarios Card</div>,
}));

vi.mock('@/components/mortgage/payment-value-card', () => ({
  PaymentValueCard: () => <div data-testid="payment-value-card">Payment Value Card</div>,
}));

vi.mock('@/components/mortgage/optimal-payment-card', () => ({
  OptimalPaymentCard: () => <div data-testid="optimal-payment-card">Optimal Payment Card</div>,
}));

vi.mock('@/components/mortgage/mortgage-edit-dialog', () => ({
  MortgageEditDialog: ({ isOpen, onClose, onSubmit, initialData }) => (
    <div data-testid="mortgage-edit-dialog">
      <p>
        {isOpen ? 'Dialog Open' : 'Dialog Closed'} - 
        {initialData ? `Editing ${initialData.name}` : 'Creating New Property'}
      </p>
      <button onClick={() => onSubmit({ name: 'New Property', propertyValue: 300000, mortgageBalance: 250000, interestRate: 0.04, loanTerm: 30, startDate: '2023-01-01' })}>
        Submit Form
      </button>
      <button onClick={onClose}>Close Dialog</button>
    </div>
  ),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the lib/queryClient to return our test data
vi.mock('@/lib/queryClient', () => {
  const actual = vi.importActual('@/lib/queryClient');
  return {
    ...actual,
    apiRequest: vi.fn().mockImplementation((method, url, data) => {
      if (method === 'POST' && url === '/api/mortgages') {
        return {
          ok: true,
          json: () => Promise.resolve({
            id: 3,
            name: data.name || 'New Property',
            propertyValue: data.propertyValue || 300000,
            mortgageBalance: data.mortgageBalance || 250000,
            interestRate: data.interestRate || 0.04,
            loanTerm: data.loanTerm || 30,
            startDate: data.startDate || '2023-01-01',
            userId: 'user123',
          }),
        };
      } else if (method === 'PUT' && url.startsWith('/api/mortgages/')) {
        const id = Number(url.split('/').pop());
        return {
          ok: true,
          json: () => Promise.resolve({
            id,
            name: data.name,
            propertyValue: data.propertyValue,
            mortgageBalance: data.mortgageBalance,
            interestRate: data.interestRate,
            loanTerm: data.loanTerm,
            startDate: data.startDate,
            userId: 'user123',
          }),
        };
      }
      return { ok: true, json: () => Promise.resolve({}) };
    }),
  };
});

describe('HomePage', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Mock fetch for API calls
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/mortgages') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              name: 'Property 1',
              propertyValue: '400000',
              mortgageBalance: '350000',
              interestRate: '0.045',
              loanTerm: 30,
              startDate: '2023-01-01',
              userId: 'user123',
            },
            {
              id: 2,
              name: 'Property 2',
              propertyValue: '500000',
              mortgageBalance: '450000',
              interestRate: '0.04',
              loanTerm: 30,
              startDate: '2023-01-01',
              userId: 'user123',
            },
          ]),
        });
      } else if (url.includes('/api/mortgages/') && url.includes('/scenarios')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders loading state initially', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Loading your mortgage data/i)).toBeInTheDocument();
  });

  it('renders multiple properties and allows switching between them', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    // Check that property selector shows both properties
    const propertySelect = screen.getByLabelText(/Select Property/i);
    expect(propertySelect).toBeInTheDocument();
    
    // There should be 2 options
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(2);
    
    // The first property should be selected by default
    expect(screen.getByText(/Property Name: Property 1/i)).toBeInTheDocument();
    
    // Switch to the second property
    await user.selectOptions(propertySelect, '2');
    
    // The second property should now be displayed
    await waitFor(() => {
      expect(screen.getByText(/Property Name: Property 2/i)).toBeInTheDocument();
    });
  });

  it('opens edit dialog with the selected property data when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    // Click the edit button on the mortgage details card
    const editButton = screen.getByText(/Edit Property/i);
    await user.click(editButton);
    
    // Check that the dialog is open with the correct property data
    expect(screen.getByText(/Dialog Open/i)).toBeInTheDocument();
    expect(screen.getByText(/Editing Property 1/i)).toBeInTheDocument();
  });

  it('opens create dialog with empty data when add property button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    // Click the add property button
    const addButton = screen.getByText(/Add another property/i);
    await user.click(addButton);
    
    // Check that the dialog is open for creating a new property
    expect(screen.getByText(/Dialog Open/i)).toBeInTheDocument();
    expect(screen.getByText(/Creating New Property/i)).toBeInTheDocument();
  });

  it('creates a new property without overwriting existing ones', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    // Initial check - Property 1 should be visible
    expect(screen.getByText(/Property Name: Property 1/i)).toBeInTheDocument();

    // Add a new property
    const addButton = screen.getByText(/Add another property/i);
    await user.click(addButton);
    
    // Submit the dialog form for the new property
    const submitButton = screen.getByText(/Submit Form/i);
    await user.click(submitButton);
    
    // Mock fetch to add the new property to the list
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/mortgages') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 1,
              name: 'Property 1',
              propertyValue: '400000',
              mortgageBalance: '350000',
              interestRate: '0.045',
              loanTerm: 30,
              startDate: '2023-01-01',
              userId: 'user123',
            },
            {
              id: 2,
              name: 'Property 2',
              propertyValue: '500000',
              mortgageBalance: '450000',
              interestRate: '0.04',
              loanTerm: 30,
              startDate: '2023-01-01',
              userId: 'user123',
            },
            {
              id: 3,
              name: 'New Property',
              propertyValue: '300000',
              mortgageBalance: '250000',
              interestRate: '0.04',
              loanTerm: 30,
              startDate: '2023-01-01',
              userId: 'user123',
            },
          ]),
        });
      } else if (url.includes('/api/mortgages/') && url.includes('/scenarios')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    // Wait for the new property to be shown
    await waitFor(() => {
      // Check that the optimal payment card is shown (for multiple properties)
      expect(screen.getByTestId('optimal-payment-card')).toBeInTheDocument();
    });
    
    // The property select should now have 3 options
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
    
    // All properties should be in the dropdown
    const optionTexts = options.map(option => option.textContent);
    expect(optionTexts).toContain('Property 1');
    expect(optionTexts).toContain('Property 2');
    expect(optionTexts).toContain('New Property');
  });
});