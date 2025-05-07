import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  calculateMonthlyPayment,
  calculateAmortizationSchedule,
  calculateAmortizationWithExtraPayment,
  calculatePaymentFutureValue,
  calculateOptimalPaymentDistribution,
} from '../utils/mortgage-calculations';

describe('Mortgage Calculation Utilities', () => {
  describe('formatCurrency', () => {
    it('should format numbers as currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1000.5, 2)).toBe('$1,000.50');
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(-1000)).toBe('-$1,000');
    });
  });

  describe('formatPercentage', () => {
    it('should format numbers as percentages', () => {
      expect(formatPercentage(0.05)).toBe('5.000%');
      expect(formatPercentage(0.05, 2)).toBe('5.00%');
      expect(formatPercentage(0)).toBe('0.000%');
    });
  });

  describe('calculateMonthlyPayment', () => {
    it('should calculate the correct monthly payment', () => {
      // Test a standard 30-year mortgage at 5% for $300,000
      const principal = 300000;
      const annualRate = 0.05;
      const years = 30;
      
      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
      
      // Monthly payment should be ~$1,610.46
      expect(monthlyPayment).toBeCloseTo(1610.46, 0);
    });

    it('should handle edge cases', () => {
      // Zero principal
      expect(calculateMonthlyPayment(0, 0.05, 30)).toBe(0);
      
      // Zero interest
      const payment = calculateMonthlyPayment(300000, 0, 30);
      expect(payment).toBeCloseTo(300000 / (30 * 12), 2);
    });
  });

  describe('calculateAmortizationSchedule', () => {
    it('should calculate the correct amortization schedule', () => {
      const principal = 300000;
      const annualRate = 0.05;
      const years = 30;
      
      const schedule = calculateAmortizationSchedule(principal, annualRate, years);
      
      // Schedule should have 30 entries (one per year)
      expect(schedule.length).toBe(30);
      
      // First year
      expect(schedule[0].year).toBe(1);
      expect(schedule[0].startingBalance).toBeCloseTo(300000, 0);
      
      // Last year
      expect(schedule[29].year).toBe(30);
      expect(schedule[29].endingBalance).toBeCloseTo(0, 0);
      
      // Sum of all yearly payments should equal loan amount plus total interest
      const totalPayments = schedule.reduce((sum, year) => 
        sum + year.yearlyPrincipal + year.yearlyInterest, 0);
      expect(totalPayments).toBeCloseTo(1610.46 * 12 * 30, 0);
    });
  });

  describe('calculateAmortizationWithExtraPayment', () => {
    it('should reduce the loan term with extra payments', () => {
      const principal = 300000;
      const annualRate = 0.05;
      const years = 30;
      const extraPayment = 200; // $200 extra per month
      
      const regularSchedule = calculateAmortizationSchedule(principal, annualRate, years);
      const extraPaymentSchedule = calculateAmortizationWithExtraPayment(
        principal, annualRate, years, extraPayment
      );
      
      // Extra payment schedule should end earlier
      expect(extraPaymentSchedule.length).toBeLessThan(regularSchedule.length);
      
      // Total interest paid should be less
      const regularTotalInterest = regularSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      const extraTotalInterest = extraPaymentSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      
      expect(extraTotalInterest).toBeLessThan(regularTotalInterest);
    });
  });

  describe('calculatePaymentFutureValue', () => {
    it('should calculate the future value of additional payments', () => {
      const additionalPayment = 1000;
      const annualRate = 0.05;
      const yearsRemaining = 20;
      
      const futureValue = calculatePaymentFutureValue(additionalPayment, annualRate, yearsRemaining);
      
      // Future value should be greater than the initial payment
      expect(futureValue).toBeGreaterThan(additionalPayment);
      
      // Simplified calculation to verify:
      // This is approximate since the actual calculation accounts for monthly interest
      const simplifiedFV = additionalPayment * Math.pow(1 + annualRate, yearsRemaining);
      
      // Values should be within 10% of each other
      const ratio = futureValue / simplifiedFV;
      expect(ratio).toBeGreaterThan(0.9);
      expect(ratio).toBeLessThan(1.1);
    });
  });

  describe('calculateOptimalPaymentDistribution', () => {
    it('should allocate more payment to higher interest rate mortgages', () => {
      const mortgages = [
        { id: 1, name: 'Home', futureValue: 0, returnOnInvestment: 0, interestRate: 0.04, yearsRemaining: 25 },
        { id: 2, name: 'Rental', futureValue: 0, returnOnInvestment: 0, interestRate: 0.06, yearsRemaining: 20 },
      ];
      
      const extraPayment = 1000;
      
      const result = calculateOptimalPaymentDistribution(mortgages, extraPayment);
      
      // Higher interest rate mortgage should get more allocation
      expect(result[1].futureValue).toBeGreaterThan(result[0].futureValue);
      
      // Total allocation should equal the extra payment amount
      const totalAllocated = result.reduce((sum, mortgage) => sum + mortgage.futureValue, 0);
      expect(totalAllocated).toBeCloseTo(extraPayment, 0);
    });
  });
});