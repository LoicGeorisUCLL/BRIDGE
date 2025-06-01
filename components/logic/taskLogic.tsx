import { UserProfile } from "@/types";

  export const generatePersonalizedTasks = (profile: UserProfile): string[] => {
    const allTasks = ['limosa'];
    
    // Add municipality registration if staying more than 6 months
    if (profile.duration === "2") {
      allTasks.push('municipality');
    }
    
    // Always add health insurance and bank account
    allTasks.push('health', 'bank');
    
    // Add tax number if staying more than 3 months
    if (profile.duration !== undefined && profile.duration > "1") {
      allTasks.push('tax');
    }
    
    // Always add emergency contact
    allTasks.push('emergency');
    
    return allTasks;
  };