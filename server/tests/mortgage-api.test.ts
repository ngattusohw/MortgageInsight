import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import express from 'express';
import { Request, Response } from 'express';
import request from 'supertest';
import { createServer } from 'http';
import { storage } from '../storage';

// Mock the storage implementation
vi.mock('../storage', () => ({
  storage: {
    getMortgages: vi.fn(),
    getMortgage: vi.fn(),
    createMortgage: vi.fn(),
    updateMortgage: vi.fn(),
    deleteMortgage: vi.fn(),
  },
}));

// Mock the authentication middleware
vi.mock('../replitAuth', () => ({
  isAuthenticated: (req: Request, res: Response, next: Function) => {
    req.user = { claims: { sub: 'test-user-id' } };
    next();
  },
}));

describe('Mortgage API Endpoints', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Register mortgage routes
    app.get('/api/mortgages', async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const mortgages = await storage.getMortgages(userId);
        res.json(mortgages);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post('/api/mortgages', async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const mortgage = await storage.createMortgage({
          ...req.body,
          userId,
        });
        res.status(201).json(mortgage);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/mortgages/:id', async (req: any, res) => {
      try {
        const mortgage = await storage.getMortgage(Number(req.params.id));
        if (!mortgage) {
          return res.status(404).json({ message: 'Mortgage not found' });
        }
        res.json(mortgage);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    server = createServer(app);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/mortgages', () => {
    it('should return mortgages for the authenticated user', async () => {
      const mockMortgages = [
        { id: 1, propertyName: 'Test Property 1', userId: 'test-user-id' },
        { id: 2, propertyName: 'Test Property 2', userId: 'test-user-id' },
      ];
      
      vi.mocked(storage.getMortgages).mockResolvedValue(mockMortgages);
      
      const response = await request(app).get('/api/mortgages');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMortgages);
      expect(storage.getMortgages).toHaveBeenCalledWith('test-user-id');
    });
    
    it('should handle errors', async () => {
      vi.mocked(storage.getMortgages).mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/mortgages');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Database error' });
    });
  });

  describe('POST /api/mortgages', () => {
    it('should create a new mortgage for the authenticated user', async () => {
      const mortgageData = {
        propertyName: 'New Property',
        propertyValue: 400000,
        mortgageBalance: 300000,
        interestRate: 0.05,
        monthlyPayment: 1610.46,
        loanTerm: 30,
      };
      
      const createdMortgage = {
        id: 3,
        userId: 'test-user-id',
        ...mortgageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(storage.createMortgage).mockResolvedValue(createdMortgage);
      
      const response = await request(app)
        .post('/api/mortgages')
        .send(mortgageData);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdMortgage);
      expect(storage.createMortgage).toHaveBeenCalledWith({
        ...mortgageData,
        userId: 'test-user-id',
      });
    });
    
    it('should handle errors during mortgage creation', async () => {
      vi.mocked(storage.createMortgage).mockRejectedValue(new Error('Invalid data'));
      
      const response = await request(app)
        .post('/api/mortgages')
        .send({});
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Invalid data' });
    });
  });

  describe('GET /api/mortgages/:id', () => {
    it('should return a specific mortgage by ID', async () => {
      const mockMortgage = {
        id: 1,
        propertyName: 'Test Property',
        userId: 'test-user-id',
      };
      
      vi.mocked(storage.getMortgage).mockResolvedValue(mockMortgage);
      
      const response = await request(app).get('/api/mortgages/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMortgage);
      expect(storage.getMortgage).toHaveBeenCalledWith(1);
    });
    
    it('should return 404 if mortgage is not found', async () => {
      vi.mocked(storage.getMortgage).mockResolvedValue(undefined);
      
      const response = await request(app).get('/api/mortgages/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Mortgage not found' });
    });
  });
});