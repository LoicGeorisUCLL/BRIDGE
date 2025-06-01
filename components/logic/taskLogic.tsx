import { UserProfile } from "@/types";

  export const generatePersonalizedTasks = (profile: UserProfile): string[] => {
    const allTasks = ['limosa'];
    
    // Add municipality registration if staying more than 6 months
    if (profile.duration === 'Więcej niż 6 miesięcy' || profile.duration === 'More than 6 months') {
      allTasks.push('municipality');
    }
    
    // Always add health insurance and bank account
    allTasks.push('health', 'bank');
    
    // Add tax number if staying longer or working regularly
    if (profile.duration !== 'Mniej niż 3 miesiące' && profile.duration !== 'Less than 3 months') {
      allTasks.push('tax');
    }
    
    // Always add emergency contact
    allTasks.push('emergency');
    
    return allTasks;
  };