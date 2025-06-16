import { UserProfile } from "@/types";

export const generatePersonalizedTasks = (profile: UserProfile): string[] => {
  const allTasks: string[] = [];

  // Extract user profile answers for precise task assignment
  const workDuration = profile.answers[0];
  const workContractStatus = profile.answers[1];
  const healthInsuranceStatus = profile.answers[2];
  const bankAccountStatus = profile.answers[3];

  // 1. Municipal Registration: Required for stays of 3 months or more
  // Regulation: All seasonal workers staying over 3 months must register locally
  if (workDuration === 1) {
    allTasks.push('municipal_registration');
  }

  // 2. Work Contract Validation: Required for workers without confirmed contract
  // Regulation: All seasonal workers must have a valid work contract
  if (workContractStatus === 1 || workContractStatus === 2) {
    allTasks.push('work_contract_validation');
  }

  // 3. Health Insurance Registration: Required for workers lacking coverage
  // Regulation: All seasonal workers must have health insurance for entire stay
  if (healthInsuranceStatus === 1 || healthInsuranceStatus === 2) {
    allTasks.push('health_insurance_registration');
  }

  // 4. Wage Bank Account Setup: Required for workers without Belgian bank account
  // Regulation: All seasonal workers need a bank account to receive wages
  if (bankAccountStatus === 1) {
    allTasks.push('wage_bank_account_setup');
  }

  // 5. Extended Stay Additional Requirements
  // Add specific tasks for workers staying 3 months or more
  if (workDuration === 1) {
    // Ensure municipal registration is included for longer stays
    if (!allTasks.includes('municipal_registration')) {
      allTasks.push('municipal_registration');
    }
    // Additional tasks could be added here for extended stays if needed
  }

  return allTasks;
};
