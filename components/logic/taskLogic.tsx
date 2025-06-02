import { UserProfile } from "@/types";

  export const generatePersonalizedTasks = (profile: UserProfile): string[] => {
    const allTasks = [];
    
    // Always add municipality registration
    allTasks.push('municipality');

    if (profile.contract !== undefined && profile.contract > "0") {
      allTasks.push('contract');
    }

    // Always add health insurance & bijlage3
    allTasks.push('health', 'bijlage3');

    if (profile.bankAccount !== undefined && profile.bankAccount == "1") {
      allTasks.push('bank');
    }

    // Always add emergency contact & practical information
    allTasks.push('emergency', 'practical');

    return allTasks;
  };