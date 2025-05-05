import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMortgageSchema, insertScenarioSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Auth middleware to protect routes
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Helper to format Zod validation errors
  const handleValidation = (schema: any, data: any) => {
    try {
      return { data: schema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { data: null, error: fromZodError(error).message };
      }
      return { data: null, error: "Validation error" };
    }
  };
  
  // Mortgage routes
  app.get("/api/mortgages", requireAuth, async (req, res) => {
    try {
      const mortgages = await storage.getMortgages(req.user!.id);
      res.json(mortgages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mortgages" });
    }
  });
  
  app.get("/api/mortgages/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mortgage = await storage.getMortgage(id);
      
      if (!mortgage) {
        return res.status(404).json({ message: "Mortgage not found" });
      }
      
      // Check if mortgage belongs to the user
      if (mortgage.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(mortgage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mortgage" });
    }
  });
  
  app.post("/api/mortgages", requireAuth, async (req, res) => {
    try {
      const { data, error } = handleValidation(insertMortgageSchema, {
        ...req.body,
        userId: req.user!.id
      });
      
      if (error) {
        return res.status(400).json({ message: error });
      }
      
      const mortgage = await storage.createMortgage(data);
      res.status(201).json(mortgage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create mortgage" });
    }
  });
  
  app.put("/api/mortgages/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mortgage = await storage.getMortgage(id);
      
      if (!mortgage) {
        return res.status(404).json({ message: "Mortgage not found" });
      }
      
      // Check if mortgage belongs to the user
      if (mortgage.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Filter out userId to prevent changing ownership
      const { userId, ...updateData } = req.body;
      
      const updatedMortgage = await storage.updateMortgage(id, updateData);
      res.json(updatedMortgage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update mortgage" });
    }
  });
  
  app.delete("/api/mortgages/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mortgage = await storage.getMortgage(id);
      
      if (!mortgage) {
        return res.status(404).json({ message: "Mortgage not found" });
      }
      
      // Check if mortgage belongs to the user
      if (mortgage.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteMortgage(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mortgage" });
    }
  });
  
  // Scenario routes
  app.get("/api/mortgages/:mortgageId/scenarios", requireAuth, async (req, res) => {
    try {
      const mortgageId = parseInt(req.params.mortgageId);
      const mortgage = await storage.getMortgage(mortgageId);
      
      if (!mortgage) {
        return res.status(404).json({ message: "Mortgage not found" });
      }
      
      // Check if mortgage belongs to the user
      if (mortgage.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const scenarios = await storage.getScenarios(mortgageId);
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scenarios" });
    }
  });
  
  app.post("/api/mortgages/:mortgageId/scenarios", requireAuth, async (req, res) => {
    try {
      const mortgageId = parseInt(req.params.mortgageId);
      const mortgage = await storage.getMortgage(mortgageId);
      
      if (!mortgage) {
        return res.status(404).json({ message: "Mortgage not found" });
      }
      
      // Check if mortgage belongs to the user
      if (mortgage.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { data, error } = handleValidation(insertScenarioSchema, {
        ...req.body,
        mortgageId
      });
      
      if (error) {
        return res.status(400).json({ message: error });
      }
      
      const scenario = await storage.createScenario(data);
      res.status(201).json(scenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to create scenario" });
    }
  });
  
  app.put("/api/scenarios/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      // Check if the associated mortgage belongs to the user
      const mortgage = await storage.getMortgage(scenario.mortgageId);
      if (!mortgage || mortgage.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Filter out mortgageId to prevent moving scenario to another mortgage
      const { mortgageId, ...updateData } = req.body;
      
      const updatedScenario = await storage.updateScenario(id, updateData);
      res.json(updatedScenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to update scenario" });
    }
  });
  
  app.delete("/api/scenarios/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      // Check if the associated mortgage belongs to the user
      const mortgage = await storage.getMortgage(scenario.mortgageId);
      if (!mortgage || mortgage.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteScenario(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
