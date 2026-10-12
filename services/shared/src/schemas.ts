import { z } from 'zod';

export const subjectSchema = z.enum(['math', 'vietnamese']);
export const childIdSchema = z.string().trim().min(1).max(100);
export const questionIdSchema = z.string().trim().min(1).max(100);

export const createChildSchema = z.object({
  name: z.string().trim().min(1).max(80),
  age: z.number().int().min(4).max(18),
}).strict();

export const updateChildSchema = createChildSchema.partial().refine(value => Object.keys(value).length > 0, 'At least one field is required.');

export const createQuestionSchema = z.object({
  subject: subjectSchema,
  age: z.number().int().min(4).max(18),
  prompt: z.string().trim().min(1).max(1000),
  answer: z.string().trim().min(1).max(500),
  choices: z.array(z.string().trim().min(1).max(200)).min(2).max(8).optional(),
}).strict();

export const updateQuestionSchema = createQuestionSchema.partial().refine(value => Object.keys(value).length > 0, 'At least one field is required.');

export const questionFilterSchema = z.object({
  subject: subjectSchema.optional(),
  age: z.coerce.number().int().min(4).max(18).optional(),
}).strict();

export const importQuestionOptionsSchema = z.object({
  subject: subjectSchema,
  ageRange: z.string().regex(/^\d{1,2}-\d{1,2}$/),
}).strict();

export const checkAnswerSchema = z.object({
  childId: childIdSchema,
  questionId: questionIdSchema,
  answer: z.string().trim().min(1).max(500),
}).strict();

export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionFilter = z.infer<typeof questionFilterSchema>;
export type ImportQuestionOptions = z.infer<typeof importQuestionOptionsSchema>;
export type CheckAnswerInput = z.infer<typeof checkAnswerSchema>;