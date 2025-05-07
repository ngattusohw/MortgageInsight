import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMortgage, updateMortgage, getMortgages } from '../api-client/mortgage-api';
import { waitFor } from '@testing-library/react';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Mortgage Property Creation Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a new mortgage without overwriting existing ones', async () => {
    // Mock existing mortgages response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'Existing Property',
          propertyValue: 400000,
          mortgageBalance: 300000,
          interestRate: 0.05,
          loanTerm: 30,
          userId: 'test-user-id'
        }
      ])
    } as Response);

    // Mock successful creation response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({
        id: 2,
        name: 'New Property',
        propertyValue: 500000,
        mortgageBalance: 400000,
        interestRate: 0.045,
        loanTerm: 30,
        userId: 'test-user-id'
      })
    } as Response);

    // Mock final mortgages list after creation
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'Existing Property',
          propertyValue: 400000,
          mortgageBalance: 300000,
          interestRate: 0.05,
          loanTerm: 30,
          userId: 'test-user-id'
        },
        { 
          id: 2, 
          name: 'New Property',
          propertyValue: 500000,
          mortgageBalance: 400000,
          interestRate: 0.045,
          loanTerm: 30,
          userId: 'test-user-id'
        }
      ])
    } as Response);

    // Get initial mortgages list
    const initialMortgages = await getMortgages();
    expect(initialMortgages.length).toBe(1);
    expect(initialMortgages[0].name).toBe('Existing Property');

    // Create a new mortgage
    const newMortgageData = {
      name: 'New Property',
      propertyValue: 500000,
      mortgageBalance: 400000,
      interestRate: 0.045,
      loanTerm: 30,
      startDate: new Date().toISOString().split('T')[0]
    };
    
    const newMortgage = await createMortgage(newMortgageData);
    expect(newMortgage.id).toBe(2);
    expect(newMortgage.name).toBe('New Property');

    // Verify both mortgages exist after creation
    const updatedMortgages = await getMortgages();
    expect(updatedMortgages.length).toBe(2);
    
    // Verify both mortgage IDs are different
    expect(updatedMortgages[0].id).not.toBe(updatedMortgages[1].id);
    
    // Verify mortgage names are preserved
    const names = updatedMortgages.map(m => m.name);
    expect(names).toContain('Existing Property');
    expect(names).toContain('New Property');
  });

  it('should update an existing mortgage without affecting others', async () => {
    // Mock existing mortgages response with two properties
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'First Property',
          propertyValue: 400000,
          mortgageBalance: 300000,
          interestRate: 0.05,
          loanTerm: 30,
          userId: 'test-user-id'
        },
        { 
          id: 2, 
          name: 'Second Property',
          propertyValue: 500000,
          mortgageBalance: 400000,
          interestRate: 0.045,
          loanTerm: 30,
          userId: 'test-user-id'
        }
      ])
    } as Response);

    // Mock successful update response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        name: 'Updated First Property',
        propertyValue: 420000,
        mortgageBalance: 310000,
        interestRate: 0.048,
        loanTerm: 30,
        userId: 'test-user-id'
      })
    } as Response);

    // Mock final mortgages list after update
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { 
          id: 1, 
          name: 'Updated First Property',
          propertyValue: 420000,
          mortgageBalance: 310000,
          interestRate: 0.048,
          loanTerm: 30,
          userId: 'test-user-id'
        },
        { 
          id: 2, 
          name: 'Second Property',
          propertyValue: 500000,
          mortgageBalance: 400000,
          interestRate: 0.045,
          loanTerm: 30,
          userId: 'test-user-id'
        }
      ])
    } as Response);

    // Get initial mortgages list
    const initialMortgages = await getMortgages();
    expect(initialMortgages.length).toBe(2);

    // Update the first mortgage
    const updateData = {
      name: 'Updated First Property',
      propertyValue: 420000,
      mortgageBalance: 310000,
      interestRate: 0.048
    };
    
    const updatedMortgage = await updateMortgage(1, updateData);
    expect(updatedMortgage.name).toBe('Updated First Property');

    // Verify both mortgages still exist after update
    const updatedMortgages = await getMortgages();
    expect(updatedMortgages.length).toBe(2);
    
    // Verify properties are correctly updated
    expect(updatedMortgages[0].name).toBe('Updated First Property');
    expect(updatedMortgages[1].name).toBe('Second Property');
  });
});