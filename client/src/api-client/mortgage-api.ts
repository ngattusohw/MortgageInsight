import { Mortgage } from '@shared/schema';

interface CreateMortgageData {
  name: string;
  propertyValue: number;
  mortgageBalance: number;
  interestRate: number;
  loanTerm: number;
  startDate: string;
}

/**
 * Fetches all mortgages for the current user
 */
export async function getMortgages(): Promise<Mortgage[]> {
  const response = await fetch('/api/mortgages');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch mortgages: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetches a single mortgage by ID
 */
export async function getMortgage(id: number): Promise<Mortgage> {
  const response = await fetch(`/api/mortgages/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch mortgage: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Creates a new mortgage
 */
export async function createMortgage(data: CreateMortgageData): Promise<Mortgage> {
  const response = await fetch('/api/mortgages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create mortgage: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Updates an existing mortgage
 */
export async function updateMortgage(id: number, data: Partial<CreateMortgageData>): Promise<Mortgage> {
  const response = await fetch(`/api/mortgages/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update mortgage: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Deletes a mortgage
 */
export async function deleteMortgage(id: number): Promise<void> {
  const response = await fetch(`/api/mortgages/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete mortgage: ${response.status}`);
  }
}