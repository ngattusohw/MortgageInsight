import { pgTable, text, serial, integer, numeric, date, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const mortgages = pgTable("mortgages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // Changed to varchar for Replit Auth IDs
  propertyValue: numeric("property_value").notNull(),
  mortgageBalance: numeric("mortgage_balance").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  loanTerm: integer("loan_term").notNull(),
  startDate: date("start_date").notNull(),
  name: text("name").notNull(),
});

export const insertMortgageSchema = createInsertSchema(mortgages)
  .pick({
    userId: true,
    propertyValue: true,
    mortgageBalance: true,
    interestRate: true,
    loanTerm: true,
    startDate: true,
    name: true,
  })
  .extend({
    propertyValue: z.union([z.string().transform(val => Number(val)), z.number()]),
    mortgageBalance: z.union([z.string().transform(val => Number(val)), z.number()]),
    interestRate: z.union([z.string().transform(val => Number(val)), z.number()]),
    loanTerm: z.union([z.string().transform(val => Number(val)), z.number()]),
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

export const insertScenarioSchema = createInsertSchema(scenarios)
  .pick({
    mortgageId: true,
    name: true,
    additionalMonthlyPayment: true,
    isActive: true,
    biWeeklyPayments: true,
    annualLumpSum: true,
  })
  .extend({
    additionalMonthlyPayment: z.union([z.string().transform(val => Number(val)), z.number(), z.null()]).optional(),
    biWeeklyPayments: z.union([z.string().transform(val => Number(val)), z.number(), z.null()]).optional(),
    annualLumpSum: z.union([z.string().transform(val => Number(val)), z.number(), z.null()]).optional(),
    mortgageId: z.union([z.string().transform(val => Number(val)), z.number()]),
    isActive: z.union([z.string().transform(val => Number(val)), z.number()]),
  });

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;
