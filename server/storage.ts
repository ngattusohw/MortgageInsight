import { users, mortgages, scenarios, type User, type UpsertUser, type Mortgage, type InsertMortgage, type Scenario, type InsertScenario } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Mortgage methods
  getMortgages(userId: string): Promise<Mortgage[]>;
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
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Mortgage methods
  async getMortgages(userId: string): Promise<Mortgage[]> {
    return db.select().from(mortgages).where(eq(mortgages.userId, userId));
  }
  
  async getMortgage(id: number): Promise<Mortgage | undefined> {
    const [mortgage] = await db.select().from(mortgages).where(eq(mortgages.id, id));
    return mortgage;
  }
  
  async createMortgage(mortgage: InsertMortgage): Promise<Mortgage> {
    // Convert numeric fields to strings for drizzle
    const dbMortgage = {
      ...mortgage,
      propertyValue: mortgage.propertyValue.toString(),
      mortgageBalance: mortgage.mortgageBalance.toString(),
      interestRate: mortgage.interestRate.toString(),
      loanTerm: mortgage.loanTerm,
      startDate: new Date(mortgage.startDate).toISOString()
    };
    
    const [newMortgage] = await db.insert(mortgages).values(dbMortgage).returning();
    return newMortgage;
  }
  
  async updateMortgage(id: number, updatedFields: Partial<InsertMortgage>): Promise<Mortgage | undefined> {
    // Convert numeric fields to strings for drizzle if they exist
    const dbUpdatedFields: any = { ...updatedFields };
    if (updatedFields.propertyValue !== undefined) {
      dbUpdatedFields.propertyValue = updatedFields.propertyValue.toString();
    }
    if (updatedFields.mortgageBalance !== undefined) {
      dbUpdatedFields.mortgageBalance = updatedFields.mortgageBalance.toString();
    }
    if (updatedFields.interestRate !== undefined) {
      dbUpdatedFields.interestRate = updatedFields.interestRate.toString();
    }
    if (updatedFields.startDate !== undefined) {
      dbUpdatedFields.startDate = new Date(updatedFields.startDate).toISOString();
    }
    
    const [updatedMortgage] = await db
      .update(mortgages)
      .set(dbUpdatedFields)
      .where(eq(mortgages.id, id))
      .returning();
    return updatedMortgage;
  }
  
  async deleteMortgage(id: number): Promise<boolean> {
    // Delete related scenarios first
    await db.delete(scenarios).where(eq(scenarios.mortgageId, id));
    
    // Then delete the mortgage
    const result = await db.delete(mortgages).where(eq(mortgages.id, id)).returning();
    return result.length > 0;
  }
  
  // Scenario methods
  async getScenarios(mortgageId: number): Promise<Scenario[]> {
    return db.select().from(scenarios).where(eq(scenarios.mortgageId, mortgageId));
  }
  
  async getScenario(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }
  
  async createScenario(scenario: InsertScenario): Promise<Scenario> {
    // If this scenario is being marked as active, deactivate others
    if (scenario.isActive === 1) {
      await db
        .update(scenarios)
        .set({ isActive: 0 })
        .where(
          and(
            eq(scenarios.mortgageId, scenario.mortgageId),
            eq(scenarios.isActive, 1)
          )
        );
    }
    
    // Convert numeric fields to strings for drizzle
    const dbScenario: any = { ...scenario };
    if (dbScenario.additionalMonthlyPayment !== undefined && dbScenario.additionalMonthlyPayment !== null) {
      dbScenario.additionalMonthlyPayment = dbScenario.additionalMonthlyPayment.toString();
    }
    if (dbScenario.annualLumpSum !== undefined && dbScenario.annualLumpSum !== null) {
      dbScenario.annualLumpSum = dbScenario.annualLumpSum.toString();
    }
    
    const [newScenario] = await db.insert(scenarios).values(dbScenario).returning();
    return newScenario;
  }
  
  async updateScenario(id: number, updatedFields: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    
    if (!scenario) return undefined;
    
    // If being marked as active, deactivate others
    if (updatedFields.isActive === 1) {
      await db
        .update(scenarios)
        .set({ isActive: 0 })
        .where(
          and(
            eq(scenarios.mortgageId, scenario.mortgageId),
            eq(scenarios.isActive, 1),
            neq(scenarios.id, id) // Use 'neq' instead of 'not'
          )
        );
    }
    
    // Convert numeric fields to strings for drizzle
    const dbUpdatedFields: any = { ...updatedFields };
    if (dbUpdatedFields.additionalMonthlyPayment !== undefined && dbUpdatedFields.additionalMonthlyPayment !== null) {
      dbUpdatedFields.additionalMonthlyPayment = dbUpdatedFields.additionalMonthlyPayment.toString();
    }
    if (dbUpdatedFields.annualLumpSum !== undefined && dbUpdatedFields.annualLumpSum !== null) {
      dbUpdatedFields.annualLumpSum = dbUpdatedFields.annualLumpSum.toString();
    }
    
    const [updatedScenario] = await db
      .update(scenarios)
      .set(dbUpdatedFields)
      .where(eq(scenarios.id, id))
      .returning();
    
    return updatedScenario;
  }
  
  async deleteScenario(id: number): Promise<boolean> {
    const result = await db.delete(scenarios).where(eq(scenarios.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
