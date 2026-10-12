import type { Child, Question, Subject } from '@anchi/shared';

export type { Child, Question, Subject } from '@anchi/shared';

export interface LearningPath {
  id: string;
  childId: string;
  subject: Subject;
  title: string;
  completed: number;
  total: number;
  nodes: Array<{ title: string; state: 'done' | 'current' | 'upcoming' }>;
}

export interface RecentProgress {
  childId: string;
  childName: string;
  subject: Subject;
  correct: number;
  total: number;
  streakDays: number;
}

export interface QuestionFilter {
  subject?: Subject;
  age?: number;
}

export interface ImportQuestionsResult {
  imported: number;
  rejected: number;
  rows: Array<{ row: number; status: 'valid' | 'invalid'; message?: string }>;
}

export interface CreateQuestionInput {
  subject: Subject;
  age: number;
  prompt: string;
  answer: string;
  choices?: string[];
}

export interface ApiClient {
  health(): Promise<{ status: string; services: Record<string, boolean> }>;
  listChildren(): Promise<Child[]>;
  createChild(input: { name: string; age: number }): Promise<Child | null>;
  updateChild(childId: string, input: { name?: string; age?: number }): Promise<Child | null>;
  listLearningPaths(): Promise<LearningPath[]>;
  listRecentProgress(): Promise<RecentProgress[]>;
  listQuestions(filter: QuestionFilter): Promise<Question[]>;
  createQuestion(input: CreateQuestionInput): Promise<Question>;
  updateQuestion(questionId: string, input: Partial<CreateQuestionInput>): Promise<Question>;
  deleteQuestion(questionId: string): Promise<{ deleted: true } | null>;
  importQuestions(input: { file: File; subject: Subject; ageRange: string }): Promise<ImportQuestionsResult | null>;
  checkAnswer(input: { childId: string; questionId: string; answer: string }): Promise<{ correct: boolean; expectedAnswer: string; progress: number } | null>;
}