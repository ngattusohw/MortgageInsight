import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '../pages/home-page';

// Mock the auth context
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '123', username: 'testuser' },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock react-query hooks
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockImplementation(({ queryKey }) => {
      if (queryKey.includes('/api/mortgages')) {
        return {
          data: [
            {
              id: 1,
              userId: '123',
              propertyValue: 400000,
              mortgageBalance: 300000,
              interestRate: 0.05,
              monthlyPayment: 1610.46,
              startDate: new Date('2023-01-01'),
              propertyName: 'Test Property 1',
              loanTerm: 30,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          isLoading: false,
          error: null,
        };
      }
      if (queryKey.includes('/api/mortgages') && queryKey.includes('/scenarios')) {
        return {
          data: [],
          isLoading: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    }),
    useMutation: vi.fn().mockImplementation(() => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    })),
  };
});

// Mock the mortgage dialog component
vi.mock('../components/mortgage/mortgage-edit-dialog', () => ({
  MortgageEditDialog: ({ isOpen, onClose, onSubmit, initialData }) => (
    isOpen ? (
      <div data-testid="mortgage-dialog">
        <button onClick={() => onClose()}>Cancel</button>
        <button 
          onClick={() => onSubmit({
            propertyName: initialData ? initialData.propertyName : 'New Property',
            propertyValue: initialData ? initialData.propertyValue : 350000,
            mortgageBalance: initialData ? initialData.mortgageBalance : 280000,
            interestRate: initialData ? initialData.interestRate : 0.045,
            monthlyPayment: initialData ? initialData.monthlyPayment : 1500,
            loanTerm: initialData ? initialData.loanTerm : 30,
          })}
        >
          Save
        </button>
        <div>
          Initial Property: {initialData ? initialData.propertyName : 'None'}
        </div>
      </div>
    ) : null
  ),
}));

describe('HomePage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render existing properties', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Property 1')).toBeInTheDocument();
    });
  });

  it('should open edit dialog with property data when Update payment scenario is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    const updateButton = screen.getByText('Update payment scenario');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByTestId('mortgage-dialog')).toBeInTheDocument();
      expect(screen.getByText('Initial Property: Test Property 1')).toBeInTheDocument();
    });
  });

  it('should open dialog with null initialData when Add another property is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    const addButton = screen.getByText('Add another property');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('mortgage-dialog')).toBeInTheDocument();
      expect(screen.getByText('Initial Property: None')).toBeInTheDocument();
    });
  });

  it('should reset selectedMortgageId when Add another property is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    );

    // First click Update to select a mortgage
    const updateButton = screen.getByText('Update payment scenario');
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Initial Property: Test Property 1')).toBeInTheDocument();
    });
    
    // Close the dialog
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Now click Add another property
    const addButton = screen.getByText('Add another property');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Initial Property: None')).toBeInTheDocument();
    });
  });
});