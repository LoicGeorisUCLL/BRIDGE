export const generateRequirements = (currentQuestionIndex: number, answerIndex: number): boolean => {
  // Check ONLY immutable eligibility requirements that cannot be resolved through administrative tasks
  
  // IMPORTANT: Only block for conditions that are impossible to change or resolve
  // Examples: citizenship restrictions, age limits, legal prohibitions
  
  // Age restriction: Must be at least 25 years old (Regulation 5)
  if (currentQuestionIndex === 4 && answerIndex === 0) {
    return true; // Block - Age is immutable and cannot be changed through administrative tasks
  }

  // Number of children: Must have at least 6 kids (Regulation 6)
  if (currentQuestionIndex === 5 && answerIndex === 0) {
    return true; // Block - Number of children is considered immutable for the purposes of this application
  }
  
  return false; // Default: allow user to continue unless there's an immutable barrier
};