import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DatabaseStorage } from '../storage';
import { db } from '../db';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    eq: vi.fn(),
  },
  eq: vi.fn(),
}));

describe('DatabaseStorage', () => {
  let storage: DatabaseStorage;
  
  beforeEach(() => {
    storage = new DatabaseStorage();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getMortgages', () => {
    it('should return all mortgages for a user', async () => {
      const mockMortgages = [
        { id: 1, propertyName: 'Test Property 1', userId: 'user-1' },
        { id: 2, propertyName: 'Test Property 2', userId: 'user-1' },
      ];
      
      vi.mocked(db.returning).mockResolvedValue(mockMortgages);
      
      const result = await storage.getMortgages('user-1');
      
      expect(result).toEqual(mockMortgages);
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
  });
  
  describe('createMortgage', () => {
    it('should create a new mortgage', async () => {
      const newMortgage = {
        userId: 'user-1',
        propertyName: 'New Property',
        propertyValue: 400000,
        mortgageBalance: 300000,
        interestRate: 0.05,
        monthlyPayment: 1610.46,
        loanTerm: 30,
      };
      
      const createdMortgage = {
        id: 3,
        ...newMortgage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.returning).mockResolvedValue([createdMortgage]);
      
      const result = await storage.createMortgage(newMortgage);
      
      expect(result).toEqual(createdMortgage);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(newMortgage);
      expect(db.returning).toHaveBeenCalled();
    });
    
    it('should not overwrite existing mortgages when creating a new one', async () => {
      // First create a mortgage
      const firstMortgage = {
        userId: 'user-1',
        propertyName: 'First Property',
        propertyValue: 400000,
        mortgageBalance: 300000,
        interestRate: 0.05,
        monthlyPayment: 1610.46,
        loanTerm: 30,
      };
      
      const createdFirstMortgage = {
        id: 1,
        ...firstMortgage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.returning).mockResolvedValueOnce([createdFirstMortgage]);
      
      await storage.createMortgage(firstMortgage);
      
      // Now create a second mortgage
      const secondMortgage = {
        userId: 'user-1',
        propertyName: 'Second Property',
        propertyValue: 500000,
        mortgageBalance: 400000,
        interestRate: 0.04,
        monthlyPayment: 1900.95,
        loanTerm: 30,
      };
      
      const createdSecondMortgage = {
        id: 2,
        ...secondMortgage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.returning).mockResolvedValueOnce([createdSecondMortgage]);
      
      const result = await storage.createMortgage(secondMortgage);
      
      expect(result).toEqual(createdSecondMortgage);
      
      // Both calls should use insert/values, not update
      expect(db.insert).toHaveBeenCalledTimes(2);
      expect(db.values).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('updateMortgage', () => {
    it('should update an existing mortgage', async () => {
      const mortgageId = 1;
      const updateData = {
        propertyName: 'Updated Property',
        interestRate: 0.045,
      };
      
      const updatedMortgage = {
        id: mortgageId,
        userId: 'user-1',
        propertyName: 'Updated Property',
        propertyValue: 400000,
        mortgageBalance: 300000,
        interestRate: 0.045,
        monthlyPayment: 1610.46,
        loanTerm: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.returning).mockResolvedValue([updatedMortgage]);
      
      const result = await storage.updateMortgage(mortgageId, updateData);
      
      expect(result).toEqual(updatedMortgage);
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
    });
  });
});