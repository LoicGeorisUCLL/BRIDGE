export type Language = 'pl' | 'en';

export type Screen = 'welcome' | 'questions' | 'checklist';

export interface UserProfile {
  europeanID?: string;
  contract?: string;
  plukkaart?: string;
  duration?: string;
  workProvince?: string;
  bankAccount?: string;
  medicalCheck?: string;
  previousWork?: string;
  
}

export interface Question {
  question: string;
  options: string[];
}

export interface Task {
  title: string;
  description: string;
  icon: string;
  steps: string[];
  documents: string[];
  estimatedTime: string;
}

export interface Tasks {
  [key: string]: Task;
}

export interface Translations {
  welcome: string;
  subtitle: string;
  startButton: string;
  languageSelector: string;
  backButton: string;
  nextButton: string;
  homeButton: string;
  profileButton: string;
  questionsTitle: string;
  checklistTitle: string;
  taskCompleted: string;
  taskPending: string;
  viewDetails: string;
  completed: string;
  pending: string;
  questions: Question[];
  tasks: Tasks;
}