import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  calculateAmortizationSchedule,
  calculateAmortizationWithExtraPayment,
  calculateAmortizationWithLumpSum,
  calculateAmortizationWithBiWeeklyPayments,
  calculateAmortizationWithAnnualLumpSum,
  calculatePaymentFutureValue,
  calculateOptimalPaymentDistribution,
  formatCurrency,
  formatPercentage,
  type YearlyAmortization,
  type MortgageOptimization
} from '../utils/mortgage-calculations';

describe('Mortgage Calculations - Critical Financial Accuracy Tests', () => {
  
  describe('calculateMonthlyPayment', () => {
    it('should calculate correct monthly payment for standard 30-year mortgage', () => {
      // Test case: $400,000 loan at 6.5% for 30 years
      // Expected payment: $2,528.27 (verified with financial calculators)
      const payment = calculateMonthlyPayment(400000, 0.065, 30);
      expect(payment).toBeCloseTo(2528.27, 2);
    });

    it('should calculate correct monthly payment for 15-year mortgage', () => {
      // Test case: $300,000 loan at 5.5% for 15 years
      // Actual calculation: $2,451.25 (verified with financial calculators)
      const payment = calculateMonthlyPayment(300000, 0.055, 15);
      expect(payment).toBeCloseTo(2451.25, 2);
    });

    it('should handle high interest rate scenarios', () => {
      // Test case: $200,000 loan at 12% for 30 years
      // Expected payment: $2,057.23
      const payment = calculateMonthlyPayment(200000, 0.12, 30);
      expect(payment).toBeCloseTo(2057.23, 2);
    });

    it('should handle low interest rate scenarios', () => {
      // Test case: $500,000 loan at 2.5% for 30 years
      // Actual calculation: $1,975.60
      const payment = calculateMonthlyPayment(500000, 0.025, 30);
      expect(payment).toBeCloseTo(1975.60, 2);
    });

    it('should handle edge case of 0% interest', () => {
      // Test case: $120,000 loan at 0% for 10 years
      // Expected payment: $1,000 (simple division)
      const payment = calculateMonthlyPayment(120000, 0, 10);
      expect(payment).toBeCloseTo(1000, 2);
    });
  });

  describe('calculateAmortizationSchedule', () => {
    it('should calculate correct amortization for first year of 30-year mortgage', () => {
      // Test case: $400,000 loan at 6.5% for 30 years
      const schedule = calculateAmortizationSchedule(400000, 0.065, 30);
      
      expect(schedule).toHaveLength(30);
      
      // First year checks - using actual calculated values
      const firstYear = schedule[0];
      expect(firstYear.year).toBe(1);
      expect(firstYear.startingBalance).toBeCloseTo(400000, 2);
      expect(firstYear.yearlyInterest).toBeCloseTo(25868.36, 1); // Use actual calculated value
      expect(firstYear.yearlyPrincipal).toBeCloseTo(4470.90, 1);
      expect(firstYear.endingBalance).toBeCloseTo(395529.10, 1);
    });

    it('should calculate correct final year balance (should be near zero)', () => {
      const schedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const finalYear = schedule[schedule.length - 1];
      
      expect(finalYear.endingBalance).toBeCloseTo(0, 2);
      expect(finalYear.year).toBe(30);
    });

    it('should have decreasing interest and increasing principal over time', () => {
      const schedule = calculateAmortizationSchedule(400000, 0.065, 30);
      
      // Interest should decrease over time
      expect(schedule[0].yearlyInterest).toBeGreaterThan(schedule[10].yearlyInterest);
      expect(schedule[10].yearlyInterest).toBeGreaterThan(schedule[20].yearlyInterest);
      
      // Principal should increase over time
      expect(schedule[0].yearlyPrincipal).toBeLessThan(schedule[10].yearlyPrincipal);
      expect(schedule[10].yearlyPrincipal).toBeLessThan(schedule[20].yearlyPrincipal);
    });

    it('should have total payments equal expected amount', () => {
      const schedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const monthlyPayment = calculateMonthlyPayment(400000, 0.065, 30);
      
      const totalInterest = schedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      const totalPrincipal = schedule.reduce((sum, year) => sum + year.yearlyPrincipal, 0);
      const expectedTotalPayments = monthlyPayment * 12 * 30;
      
      expect(totalPrincipal).toBeCloseTo(400000, 2); // Should equal original loan
      expect(totalInterest + totalPrincipal).toBeCloseTo(expectedTotalPayments, 2);
    });
  });

  describe('calculateAmortizationWithExtraPayment', () => {
    it('should reduce loan term with extra monthly payments', () => {
      const standardSchedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const extraPaymentSchedule = calculateAmortizationWithExtraPayment(400000, 0.065, 30, 200);
      
      // Extra payments should result in shorter payoff time
      expect(extraPaymentSchedule.length).toBeLessThan(standardSchedule.length);
      
      // Should pay off in approximately 25 years with $200 extra monthly
      expect(extraPaymentSchedule.length).toBeCloseTo(25, 2);
    });

    it('should calculate correct interest savings with extra payments', () => {
      const standardSchedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const extraPaymentSchedule = calculateAmortizationWithExtraPayment(400000, 0.065, 30, 300);
      
      const standardTotalInterest = standardSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      const extraPaymentTotalInterest = extraPaymentSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      
      // Extra payments should significantly reduce total interest
      expect(extraPaymentTotalInterest).toBeLessThan(standardTotalInterest);
      
      // Interest savings should be substantial (over $100k for this scenario)
      const interestSavings = standardTotalInterest - extraPaymentTotalInterest;
      expect(interestSavings).toBeGreaterThan(100000);
    });

    it('should handle large extra payments correctly', () => {
      // Test with very large extra payment that pays off loan quickly
      const schedule = calculateAmortizationWithExtraPayment(400000, 0.065, 30, 2000);
      
      // Should pay off in under 12 years (corrected expectation)
      expect(schedule.length).toBeLessThan(12);
      
      // Final balance should be zero
      const finalYear = schedule[schedule.length - 1];
      expect(finalYear.endingBalance).toBeCloseTo(0, 2);
    });
  });

  describe('calculateAmortizationWithLumpSum', () => {
    it('should reduce loan balance immediately with lump sum payment', () => {
      const standardSchedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const lumpSumSchedule = calculateAmortizationWithLumpSum(400000, 0.065, 30, 50000);
      
      // Starting balance after lump sum should be reduced
      expect(lumpSumSchedule[0].startingBalance).toBeCloseTo(350000, 2);
      
      // Should pay off faster than or equal to standard schedule
      expect(lumpSumSchedule.length).toBeLessThanOrEqual(standardSchedule.length);
    });

    it('should calculate correct interest savings with lump sum', () => {
      const standardSchedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const lumpSumSchedule = calculateAmortizationWithLumpSum(400000, 0.065, 30, 75000);
      
      const standardTotalInterest = standardSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      const lumpSumTotalInterest = lumpSumSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      
      // Lump sum should create significant interest savings
      const interestSavings = standardTotalInterest - lumpSumTotalInterest;
      expect(interestSavings).toBeGreaterThan(75000); // Savings should exceed lump sum amount
    });
  });

  describe('calculateAmortizationWithBiWeeklyPayments', () => {
    it('should pay off loan faster with bi-weekly payments', () => {
      const standardSchedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const biWeeklySchedule = calculateAmortizationWithBiWeeklyPayments(400000, 0.065, 30);
      
      // Bi-weekly should pay off faster than standard and in approximately 25 years
      expect(biWeeklySchedule.length).toBeLessThan(standardSchedule.length);
      expect(biWeeklySchedule.length).toBeCloseTo(25, 1);
    });

    it('should create substantial interest savings with bi-weekly payments', () => {
      const standardSchedule = calculateAmortizationSchedule(400000, 0.065, 30);
      const biWeeklySchedule = calculateAmortizationWithBiWeeklyPayments(400000, 0.065, 30);
      
      const standardTotalInterest = standardSchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      const biWeeklyTotalInterest = biWeeklySchedule.reduce((sum, year) => sum + year.yearlyInterest, 0);
      
      // Bi-weekly should save significant interest
      const interestSavings = standardTotalInterest - biWeeklyTotalInterest;
      expect(interestSavings).toBeGreaterThan(80000);
    });
  });

  describe('calculatePaymentFutureValue', () => {
    it('should calculate correct future value of additional payment', () => {
      // $1000 additional payment at 6.5% interest for 25 years remaining
      const futureValue = calculatePaymentFutureValue(1000, 0.065, 25);
      
      // Future value should be approximately $4,828 (compound growth)
      expect(futureValue).toBeCloseTo(4828, 0);
    });

    it('should handle different time periods correctly', () => {
      const fv5years = calculatePaymentFutureValue(1000, 0.065, 5);
      const fv15years = calculatePaymentFutureValue(1000, 0.065, 15);
      const fv25years = calculatePaymentFutureValue(1000, 0.065, 25);
      
      // Future value should increase with time
      expect(fv5years).toBeLessThan(fv15years);
      expect(fv15years).toBeLessThan(fv25years);
    });
  });

  describe('calculateOptimalPaymentDistribution', () => {
    it('should prioritize highest interest rate mortgages', () => {
      const mortgages: MortgageOptimization[] = [
        {
          id: 1,
          name: "High Rate Loan",
          futureValue: 0,
          returnOnInvestment: 0,
          interestRate: 0.08, // 8%
          yearsRemaining: 20
        },
        {
          id: 2,
          name: "Low Rate Loan", 
          futureValue: 0,
          returnOnInvestment: 0,
          interestRate: 0.04, // 4%
          yearsRemaining: 25
        }
      ];

      const result = calculateOptimalPaymentDistribution(mortgages, 1000);
      
      // High rate loan should get the full payment
      const highRateLoan = result.find(m => m.id === 1);
      const lowRateLoan = result.find(m => m.id === 2);
      
      expect(highRateLoan?.futureValue).toBeGreaterThan(0);
      expect(lowRateLoan?.futureValue).toBe(0);
    });

    it('should distribute payment when one mortgage is maxed out', () => {
      const mortgages: MortgageOptimization[] = [
        {
          id: 1,
          name: "High Rate Loan",
          futureValue: 0,
          returnOnInvestment: 0,
          interestRate: 0.075,
          yearsRemaining: 5 // Short remaining term
        },
        {
          id: 2,
          name: "Medium Rate Loan",
          futureValue: 0,
          returnOnInvestment: 0,
          interestRate: 0.055,
          yearsRemaining: 25
        }
      ];

      const result = calculateOptimalPaymentDistribution(mortgages, 5000);
      
      // Both loans should receive some payment when extra is large
      expect(result.every(m => m.futureValue > 0)).toBe(true);
    });
  });

  describe('Formatting Functions', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(1234567.89)).toBe('$1,234,568');
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(1234.56, 2)).toBe('$1,234.56');
    });

    it('should format percentages correctly', () => {
      expect(formatPercentage(0.065)).toBe('6.500%');
      expect(formatPercentage(0.12345)).toBe('12.345%');
      expect(formatPercentage(0.1, 2)).toBe('10.00%');
      expect(formatPercentage(0, 1)).toBe('0.0%');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle zero principal amount', () => {
      const payment = calculateMonthlyPayment(0, 0.065, 30);
      expect(payment).toBe(0);
    });

    it('should handle very small loan amounts', () => {
      const payment = calculateMonthlyPayment(1000, 0.065, 30);
      expect(payment).toBeCloseTo(6.32, 2);
    });

    it('should handle very short loan terms', () => {
      const payment = calculateMonthlyPayment(100000, 0.065, 1);
      expect(payment).toBeCloseTo(8629.64, 2);
    });

    it('should handle maximum interest rates', () => {
      const payment = calculateMonthlyPayment(100000, 0.30, 30); // 30% rate
      expect(payment).toBeGreaterThan(2500); // Should be very high payment
    });
  });
});