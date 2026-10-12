export type Subject = 'math' | 'vietnamese';
export type QuestionFormat = 'multiple-choice' | 'typed' | 'missing-letter';

export interface Child {
  id: string;
  name: string;
  age: number;
}

export interface Question {
  id: string;
  subject: Subject;
  age: number;
  prompt: string;
  answer: string;
  choices?: string[];
  format: QuestionFormat;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}