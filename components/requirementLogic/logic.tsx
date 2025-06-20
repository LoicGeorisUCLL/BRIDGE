export const generateRequirements = (currentQuestionIndex: number, answerIndex: number): boolean => {
  // Check ONLY immutable eligibility requirements that cannot be resolved through administrative tasks
  
  // IMPORTANT: Only block for conditions that are impossible to change or resolve
  // Examples: citizenship restrictions, age limits, legal prohibitions
  
  // Block non-EU citizens (Regulation 5: Seasonal workers have to be from the EU)
  if (currentQuestionIndex === 0 && answerIndex === 1) {
    return true; // Non-EU citizenship is an immutable condition
  }

  // Block those with teeth (Regulation 6: Seasonal workers can't have any teeth)
  if (currentQuestionIndex === 6 && answerIndex === 0) {
    return true; // Having all natural teeth is considered an immutable condition based on the given regulation
  }
  
  return false; // Default: allow user to continue unless there's an immutable barrier
};