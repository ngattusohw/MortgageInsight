import { users, type User, type InsertUser, type Mortgage, type InsertMortgage, type Scenario, type InsertScenario } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Mortgage methods
  getMortgages(userId: number): Promise<Mortgage[]>;
  getMortgage(id: number): Promise<Mortgage | undefined>;
  createMortgage(mortgage: InsertMortgage): Promise<Mortgage>;
  updateMortgage(id: number, mortgage: Partial<InsertMortgage>): Promise<Mortgage | undefined>;
  deleteMortgage(id: number): Promise<boolean>;
  
  // Scenario methods
  getScenarios(mortgageId: number): Promise<Scenario[]>;
  getScenario(id: number): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: number, scenario: Partial<InsertScenario>): Promise<Scenario | undefined>;
  deleteScenario(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mortgages: Map<number, Mortgage>;
  private scenarios: Map<number, Scenario>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private mortgageIdCounter: number;
  private scenarioIdCounter: number;

  constructor() {
    this.users = new Map();
    this.mortgages = new Map();
    this.scenarios = new Map();
    this.userIdCounter = 1;
    this.mortgageIdCounter = 1;
    this.scenarioIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours in ms
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Mortgage methods
  async getMortgages(userId: number): Promise<Mortgage[]> {
    return Array.from(this.mortgages.values()).filter(
      (mortgage) => mortgage.userId === userId
    );
  }
  
  async getMortgage(id: number): Promise<Mortgage | undefined> {
    return this.mortgages.get(id);
  }
  
  async createMortgage(mortgage: InsertMortgage): Promise<Mortgage> {
    const id = this.mortgageIdCounter++;
    const newMortgage: Mortgage = { ...mortgage, id };
    this.mortgages.set(id, newMortgage);
    return newMortgage;
  }
  
  async updateMortgage(id: number, updatedFields: Partial<InsertMortgage>): Promise<Mortgage | undefined> {
    const mortgage = this.mortgages.get(id);
    if (!mortgage) return undefined;
    
    const updatedMortgage = { ...mortgage, ...updatedFields };
    this.mortgages.set(id, updatedMortgage);
    return updatedMortgage;
  }
  
  async deleteMortgage(id: number): Promise<boolean> {
    // Also delete related scenarios
    if (this.mortgages.has(id)) {
      const scenarios = await this.getScenarios(id);
      for (const scenario of scenarios) {
        await this.deleteScenario(scenario.id);
      }
      
      return this.mortgages.delete(id);
    }
    
    return false;
  }
  
  // Scenario methods
  async getScenarios(mortgageId: number): Promise<Scenario[]> {
    return Array.from(this.scenarios.values()).filter(
      (scenario) => scenario.mortgageId === mortgageId
    );
  }
  
  async getScenario(id: number): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }
  
  async createScenario(scenario: InsertScenario): Promise<Scenario> {
    const id = this.scenarioIdCounter++;
    const newScenario: Scenario = { ...scenario, id };
    this.scenarios.set(id, newScenario);
    
    // If this is marked as active, deactivate other scenarios for the same mortgage
    if (scenario.isActive === 1) {
      const otherScenarios = await this.getScenarios(scenario.mortgageId);
      for (const otherScenario of otherScenarios) {
        if (otherScenario.id !== id && otherScenario.isActive === 1) {
          await this.updateScenario(otherScenario.id, { isActive: 0 });
        }
      }
    }
    
    return newScenario;
  }
  
  async updateScenario(id: number, updatedFields: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;
    
    const updatedScenario = { ...scenario, ...updatedFields };
    this.scenarios.set(id, updatedScenario);
    
    // If being marked as active, deactivate other scenarios for the same mortgage
    if (updatedFields.isActive === 1) {
      const otherScenarios = await this.getScenarios(scenario.mortgageId);
      for (const otherScenario of otherScenarios) {
        if (otherScenario.id !== id && otherScenario.isActive === 1) {
          await this.updateScenario(otherScenario.id, { isActive: 0 });
        }
      }
    }
    
    return updatedScenario;
  }
  
  async deleteScenario(id: number): Promise<boolean> {
    return this.scenarios.delete(id);
  }
}

export const storage = new MemStorage();
