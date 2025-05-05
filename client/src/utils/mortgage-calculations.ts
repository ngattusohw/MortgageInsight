/**
 * Mortgage calculation utilities
 * These functions handle all the financial calculations for the mortgage payoff calculator
 */

/**
 * Formats a number as currency
 * @param value Number to format as currency
 * @returns Formatted string with dollar sign and commas
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formats a date to a human-readable string (e.g., "January 2053")
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Calculates the monthly mortgage payment
 * @param principal Initial loan amount
 * @param annualRate Annual interest rate (as decimal, e.g., 0.05 for 5%)
 * @param years Loan term in years
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const monthlyRate = annualRate / 12;
  const totalPayments = years * 12;
  
  // Handle edge case of zero interest
  if (annualRate === 0) {
    return principal / totalPayments;
  }
  
  return principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

/**
 * Calculate monthly interest and principal amounts
 * @param balance Current loan balance
 * @param annualRate Annual interest rate (as decimal)
 * @param monthlyPayment Total monthly payment amount
 * @returns Object containing interest and principal amounts
 */
function calculateMonthlyAmounts(balance: number, annualRate: number, monthlyPayment: number) {
  const monthlyRate = annualRate / 12;
  const interestAmount = balance * monthlyRate;
  const principalAmount = Math.min(monthlyPayment - interestAmount, balance);
  
  return {
    interestAmount,
    principalAmount,
    newBalance: balance - principalAmount
  };
}

/**
 * Interface for yearly amortization data
 */
export interface YearlyAmortization {
  year: number;
  startingBalance: number;
  endingBalance: number;
  yearlyPrincipal: number;
  yearlyInterest: number;
}

/**
 * Calculates a standard amortization schedule with yearly data
 * @param principal Initial loan amount
 * @param annualRate Annual interest rate (as decimal)
 * @param years Loan term in years
 * @returns Array of yearly amortization data
 */
export function calculateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number
): YearlyAmortization[] {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const schedule: YearlyAmortization[] = [];
  
  let currentBalance = principal;
  let year = 1;
  
  while (currentBalance > 0.01 && year <= years) {
    const yearData: YearlyAmortization = {
      year,
      startingBalance: currentBalance,
      endingBalance: 0,
      yearlyPrincipal: 0,
      yearlyInterest: 0
    };
    
    for (let month = 0; month < 12; month++) {
      if (currentBalance <= 0) break;
      
      const { interestAmount, principalAmount, newBalance } = calculateMonthlyAmounts(
        currentBalance,
        annualRate,
        monthlyPayment
      );
      
      yearData.yearlyPrincipal += principalAmount;
      yearData.yearlyInterest += interestAmount;
      currentBalance = newBalance;
    }
    
    yearData.endingBalance = currentBalance;
    schedule.push(yearData);
    year++;
    
    // Break if loan is paid off
    if (currentBalance <= 0) break;
  }
  
  return schedule;
}

/**
 * Calculates an amortization schedule with additional monthly payments
 * @param principal Initial loan amount
 * @param annualRate Annual interest rate (as decimal)
 * @param years Loan term in years
 * @param additionalMonthlyPayment Extra payment amount each month
 * @returns Array of yearly amortization data
 */
export function calculateAmortizationWithExtraPayment(
  principal: number,
  annualRate: number,
  years: number,
  additionalMonthlyPayment: number
): YearlyAmortization[] {
  const basicMonthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const totalMonthlyPayment = basicMonthlyPayment + additionalMonthlyPayment;
  const schedule: YearlyAmortization[] = [];
  
  let currentBalance = principal;
  let year = 1;
  
  while (currentBalance > 0.01 && year <= years) {
    const yearData: YearlyAmortization = {
      year,
      startingBalance: currentBalance,
      endingBalance: 0,
      yearlyPrincipal: 0,
      yearlyInterest: 0
    };
    
    for (let month = 0; month < 12; month++) {
      if (currentBalance <= 0) break;
      
      const { interestAmount, principalAmount, newBalance } = calculateMonthlyAmounts(
        currentBalance,
        annualRate,
        totalMonthlyPayment
      );
      
      yearData.yearlyPrincipal += principalAmount;
      yearData.yearlyInterest += interestAmount;
      currentBalance = newBalance;
    }
    
    yearData.endingBalance = currentBalance;
    schedule.push(yearData);
    year++;
    
    // Break if loan is paid off
    if (currentBalance <= 0) break;
  }
  
  return schedule;
}

/**
 * Calculates an amortization schedule with an initial lump sum payment
 * @param principal Initial loan amount
 * @param annualRate Annual interest rate (as decimal)
 * @param years Loan term in years
 * @param lumpSumPayment One-time payment amount applied immediately
 * @returns Array of yearly amortization data
 */
export function calculateAmortizationWithLumpSum(
  principal: number,
  annualRate: number,
  years: number,
  lumpSumPayment: number
): YearlyAmortization[] {
  // Apply lump sum payment at the beginning
  const adjustedPrincipal = Math.max(0, principal - lumpSumPayment);
  
  // If lump sum pays off the entire mortgage
  if (adjustedPrincipal === 0) {
    return [{
      year: 1,
      startingBalance: principal,
      endingBalance: 0,
      yearlyPrincipal: lumpSumPayment,
      yearlyInterest: 0
    }];
  }
  
  const monthlyPayment = calculateMonthlyPayment(adjustedPrincipal, annualRate, years);
  const schedule: YearlyAmortization[] = [];
  
  let currentBalance = adjustedPrincipal;
  let year = 1;
  
  while (currentBalance > 0.01 && year <= years) {
    const yearData: YearlyAmortization = {
      year,
      startingBalance: currentBalance,
      endingBalance: 0,
      yearlyPrincipal: 0,
      yearlyInterest: 0
    };
    
    for (let month = 0; month < 12; month++) {
      if (currentBalance <= 0) break;
      
      const { interestAmount, principalAmount, newBalance } = calculateMonthlyAmounts(
        currentBalance,
        annualRate,
        monthlyPayment
      );
      
      yearData.yearlyPrincipal += principalAmount;
      yearData.yearlyInterest += interestAmount;
      currentBalance = newBalance;
    }
    
    yearData.endingBalance = currentBalance;
    schedule.push(yearData);
    year++;
    
    // Break if loan is paid off
    if (currentBalance <= 0) break;
  }
  
  // Add the lump sum payment to the first year's principal
  if (schedule.length > 0) {
    schedule[0].yearlyPrincipal += lumpSumPayment;
  }
  
  return schedule;
}

/**
 * Calculates an amortization schedule with bi-weekly payments
 * @param principal Initial loan amount
 * @param annualRate Annual interest rate (as decimal)
 * @param years Loan term in years
 * @returns Array of yearly amortization data
 */
export function calculateAmortizationWithBiWeeklyPayments(
  principal: number,
  annualRate: number,
  years: number
): YearlyAmortization[] {
  // Bi-weekly payment is half the monthly payment but there are 26 payments per year
  // which is equivalent to 13 monthly payments instead of 12
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const biWeeklyPayment = monthlyPayment / 2;
  
  const schedule: YearlyAmortization[] = [];
  
  let currentBalance = principal;
  let year = 1;
  
  while (currentBalance > 0.01 && year <= years) {
    const yearData: YearlyAmortization = {
      year,
      startingBalance: currentBalance,
      endingBalance: 0,
      yearlyPrincipal: 0,
      yearlyInterest: 0
    };
    
    // 26 bi-weekly payments per year (equivalent to 13 monthly payments)
    for (let payment = 0; payment < 26; payment++) {
      if (currentBalance <= 0) break;
      
      const biWeeklyRate = annualRate / 26;
      const interestAmount = currentBalance * biWeeklyRate;
      const principalAmount = Math.min(biWeeklyPayment - interestAmount, currentBalance);
      
      yearData.yearlyPrincipal += principalAmount;
      yearData.yearlyInterest += interestAmount;
      currentBalance -= principalAmount;
    }
    
    yearData.endingBalance = currentBalance;
    schedule.push(yearData);
    year++;
    
    // Break if loan is paid off
    if (currentBalance <= 0) break;
  }
  
  return schedule;
}

/**
 * Calculates an amortization schedule with annual lump sum payments
 * @param principal Initial loan amount
 * @param annualRate Annual interest rate (as decimal)
 * @param years Loan term in years
 * @param annualLumpSum Lump sum payment made at the end of each year
 * @returns Array of yearly amortization data
 */
export function calculateAmortizationWithAnnualLumpSum(
  principal: number,
  annualRate: number,
  years: number,
  annualLumpSum: number
): YearlyAmortization[] {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const schedule: YearlyAmortization[] = [];
  
  let currentBalance = principal;
  let year = 1;
  
  while (currentBalance > 0.01 && year <= years) {
    const yearData: YearlyAmortization = {
      year,
      startingBalance: currentBalance,
      endingBalance: 0,
      yearlyPrincipal: 0,
      yearlyInterest: 0
    };
    
    // Calculate regular monthly payments
    for (let month = 0; month < 12; month++) {
      if (currentBalance <= 0) break;
      
      const { interestAmount, principalAmount, newBalance } = calculateMonthlyAmounts(
        currentBalance,
        annualRate,
        monthlyPayment
      );
      
      yearData.yearlyPrincipal += principalAmount;
      yearData.yearlyInterest += interestAmount;
      currentBalance = newBalance;
    }
    
    // Apply annual lump sum payment if balance remains
    if (currentBalance > 0 && annualLumpSum > 0) {
      const lumpSumPayment = Math.min(annualLumpSum, currentBalance);
      yearData.yearlyPrincipal += lumpSumPayment;
      currentBalance -= lumpSumPayment;
    }
    
    yearData.endingBalance = currentBalance;
    schedule.push(yearData);
    year++;
    
    // Break if loan is paid off
    if (currentBalance <= 0) break;
  }
  
  return schedule;
}

/**
 * Calculates the future value of an additional principal payment
 * @param additionalPayment Amount of additional payment
 * @param annualRate Annual interest rate (as decimal)
 * @param yearsRemaining Years remaining on the loan
 * @returns Future value of the payment
 */
export function calculatePaymentFutureValue(
  additionalPayment: number,
  annualRate: number,
  yearsRemaining: number
): number {
  // The future value is essentially the additional payment plus all the interest
  // that would have been charged on that amount over the remaining years
  return additionalPayment * Math.pow(1 + annualRate, yearsRemaining);
}
