import { pgTable, text, serial, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const mortgages = pgTable("mortgages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyValue: numeric("property_value").notNull(),
  mortgageBalance: numeric("mortgage_balance").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  loanTerm: integer("loan_term").notNull(),
  startDate: date("start_date").notNull(),
  name: text("name").notNull(),
});

export const insertMortgageSchema = createInsertSchema(mortgages).pick({
  userId: true,
  propertyValue: true,
  mortgageBalance: true,
  interestRate: true,
  loanTerm: true,
  startDate: true,
  name: true,
});

export type InsertMortgage = z.infer<typeof insertMortgageSchema>;
export type Mortgage = typeof mortgages.$inferSelect;

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  mortgageId: integer("mortgage_id").notNull(),
  name: text("name").notNull(),
  additionalMonthlyPayment: numeric("additional_monthly_payment"),
  isActive: integer("is_active").notNull(),
  biWeeklyPayments: integer("bi_weekly_payments"),
  annualLumpSum: numeric("annual_lump_sum"),
});

export const insertScenarioSchema = createInsertSchema(scenarios).pick({
  mortgageId: true,
  name: true,
  additionalMonthlyPayment: true,
  isActive: true,
  biWeeklyPayments: true,
  annualLumpSum: true,
});

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;
