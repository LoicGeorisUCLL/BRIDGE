import { UserProfile } from "@/types";

export const generatePersonalizedTasks = (profile: UserProfile): string[] => {
  const allTasks: string[] = [];

  // Extract user profile answers for precise task assignment
  const isEUCitizen = profile.answers[0] === 0;
  const workDuration = profile.answers[1];
  const workContractStatus = profile.answers[2];
  const healthInsuranceStatus = profile.answers[3];
  const bankAccountStatus = profile.answers[4];
  const hasHighSchoolDiploma = profile.answers[5] === 0;

  // 1. Municipal Registration: Required for stays of 3 months or more
  // Regulation 1: All seasonal workers staying over 3 months must register locally
  if (workDuration === 1) {
    allTasks.push('municipal_registration');
  }

  // 2. Work Contract Processing: Required for workers without confirmed contract
  // Regulation 2: All seasonal workers must have a valid work contract
  if (workContractStatus === 1 || workContractStatus === 2) {
    allTasks.push('work_contract_processing');
  }

  // 3. Health Insurance Setup: Required for workers lacking coverage
  // Regulation 3: All seasonal workers must have health insurance for entire stay
  if (healthInsuranceStatus === 1 || healthInsuranceStatus === 2) {
    allTasks.push('health_insurance_setup');
  }

  // 4. Bank Account Opening: Required for workers without Belgian bank account
  // Regulation 4: All seasonal workers need a bank account to receive wages
  if (bankAccountStatus === 1) {
    allTasks.push('bank_account_opening');
  }

  // 5. Additional considerations for non-EU citizens
  // While not explicitly stated in regulations, non-EU citizens may need extra documentation
  if (!isEUCitizen) {
    // Non-EU citizens might need additional work permit processing
    if (!allTasks.includes('work_contract_processing')) {
      allTasks.push('work_contract_processing');
    }
  }

  // 6. Extended Stay Additional Requirements
  // Add specific tasks for workers staying 3 months or more
  if (workDuration === 1) {
    // Ensure municipal registration is included for longer stays
    if (!allTasks.includes('municipal_registration')) {
      allTasks.push('municipal_registration');
    }
  }

  // 7. High School Diploma Verification
  // Regulation 5: All seasonal workers need a high school diploma
  // Note: This is not a task, but a requirement. We assume it's checked in eligibility,
  // but we could add a task for diploma verification if needed in the future.

  return allTasks;
};