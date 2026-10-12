import { parse } from 'csv-parse/sync';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import multer from 'multer';
import {
  checkAnswerSchema,
  childIdSchema,
  createChildSchema,
  createQuestionSchema,
  importQuestionOptionsSchema,
  questionFilterSchema,
  questionIdSchema,
  updateChildSchema,
  updateQuestionSchema,
} from '../contracts.js';
import type { AppServices } from '../services/registry.js';
import { AppError } from '../errors/appError.js';
import { asyncRoute } from '../middleware/asyncRoute.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!file.originalname.toLocaleLowerCase('en').endsWith('.csv') || (file.mimetype && !['text/csv', 'application/vnd.ms-excel', 'application/csv'].includes(file.mimetype))) {
      callback(new AppError(400, 'BAD_REQUEST', 'Upload a CSV file no larger than 2 MB.'));
      return;
    }
    callback(null, true);
  },
});

interface CsvRow {
  subject?: string;
  age?: string;
  question?: string;
  prompt?: string;
  answer?: string;
  choices?: string;
}

function parseCsvSubject(value: string | undefined, fallback: 'math' | 'vietnamese'): 'math' | 'vietnamese' | string {
  const normalized = (value ?? fallback).trim().toLocaleLowerCase('vi');
  if (normalized === 'toán' || normalized === 'toan') return 'math';
  if (normalized.includes('tiếng việt') || normalized.includes('tieng viet') || normalized === 'vietnamese') return 'vietnamese';
  return normalized;
}

export function createApiRouter(services: AppServices): Router {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.status(200).json({ status: 'healthy', services: { questionBank: true, answerChecking: true } });
  });

  router.get('/openapi.json', (_request, response) => {
    response.status(200).json(openApiDocument);
  });

  router.get('/children', (_request, response) => {
    response.status(200).json({ children: services.children.list() });
  });

  router.post('/children', asyncRoute((request, response) => {
    const input = createChildSchema.parse(request.body);
    response.status(201).json({ child: services.children.create(input) });
  }));

  router.patch('/children/:childId', asyncRoute((request, response) => {
    const childId = childIdSchema.parse(request.params.childId);
    const input = updateChildSchema.parse(request.body);
    response.status(200).json({ child: services.children.update(childId, input) });
  }));

  router.get('/questions', asyncRoute((request, response) => {
    const filter = questionFilterSchema.parse(request.query);
    response.status(200).json({ questions: services.questions.list(filter) });
  }));

  router.post('/questions', asyncRoute((request, response) => {
    const input = createQuestionSchema.parse(request.body);
    response.status(201).json({ question: services.questions.create(input) });
  }));

  router.patch('/questions/:questionId', asyncRoute((request, response) => {
    const questionId = questionIdSchema.parse(request.params.questionId);
    const input = updateQuestionSchema.parse(request.body);
    response.status(200).json({ question: services.questions.update(questionId, input) });
  }));

  router.delete('/questions/:questionId', asyncRoute((request, response) => {
    const questionId = questionIdSchema.parse(request.params.questionId);
    services.questions.remove(questionId);
    response.status(200).json({ deleted: true });
  }));

  const receiveCsv = upload.single('file') as unknown as RequestHandler;
  router.post('/questions/import', receiveCsv, asyncRoute((request, response) => {
    const options = importQuestionOptionsSchema.parse({ subject: request.body.subject, ageRange: request.body.ageRange });
    if (!request.file) throw new AppError(400, 'BAD_REQUEST', 'A CSV file is required.');

    let csvRows: CsvRow[];
    try {
      csvRows = parse(request.file.buffer, { columns: true, skip_empty_lines: true, bom: true, trim: true }) as CsvRow[];
    } catch (error) {
      throw new AppError(400, 'BAD_REQUEST', 'The CSV file could not be parsed.', error instanceof Error ? error.message : undefined);
    }
    if (csvRows.length > 1000) throw new AppError(422, 'VALIDATION_ERROR', 'A CSV import may contain at most 1,000 rows.');

    const [minimumAge, maximumAge] = options.ageRange.split('-').map(Number);
    const defaultAge = minimumAge;
    const accepted: Array<ReturnType<typeof createQuestionSchema.parse>> = [];
    const rows = csvRows.map((row, index) => {
      const choices = row.choices?.split('|').map(choice => choice.trim()).filter(Boolean);
      const parsed = createQuestionSchema.safeParse({
        subject: parseCsvSubject(row.subject, options.subject),
        age: row.age ? Number(row.age) : defaultAge,
        prompt: row.question ?? row.prompt ?? '',
        answer: row.answer ?? '',
        ...(choices?.length ? { choices } : {}),
      });
      if (!parsed.success) {
        return { row: index + 2, status: 'invalid' as const, message: parsed.error.issues.map(issue => issue.message).join(' ') };
      }
      if (parsed.data.age < minimumAge || parsed.data.age > maximumAge) {
        return { row: index + 2, status: 'invalid' as const, message: `Age must be between ${minimumAge} and ${maximumAge}.` };
      }
      accepted.push(parsed.data);
      return { row: index + 2, status: 'valid' as const };
    });

    services.questions.createMany(accepted);
    response.status(200).json({ imported: accepted.length, rejected: csvRows.length - accepted.length, rows });
  }));

  router.post('/answers', asyncRoute((request, response) => {
    const input = checkAnswerSchema.parse(request.body);
    if (!services.children.list().some(child => child.id === input.childId)) {
      throw new AppError(404, 'NOT_FOUND', 'Child profile was not found.');
    }
    response.status(200).json({ childId: input.childId, questionId: input.questionId, ...services.answers.check(input.questionId, input.answer) });
  }));

  return router;
}

const openApiDocument = {
  openapi: '3.0.3',
  info: { title: 'AnChi Learning API', version: '1.0.0' },
  servers: [{ url: '/api' }],
  paths: {
    '/health': { get: { summary: 'Check API health', responses: { '200': { description: 'Healthy' }, '503': { description: 'Unavailable' } } } },
    '/children': {
      get: { summary: 'List child profiles', responses: { '200': { description: 'Child profiles' } } },
      post: { summary: 'Create a child profile', responses: { '201': { description: 'Created' }, '422': { description: 'Invalid input' } } },
    },
    '/children/{childId}': { patch: { summary: 'Update a child profile', responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' }, '422': { description: 'Invalid input' } } } },
    '/questions': {
      get: { summary: 'Filter questions by subject and age', responses: { '200': { description: 'Questions' }, '422': { description: 'Invalid filter' } } },
      post: { summary: 'Add a question', responses: { '201': { description: 'Created' }, '422': { description: 'Invalid input' } } },
    },
    '/questions/{questionId}': {
      patch: { summary: 'Update a question', responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' }, '422': { description: 'Invalid input' } } },
      delete: { summary: 'Remove a question', responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } } },
    },
    '/questions/import': { post: { summary: 'Validate and import CSV questions in memory', responses: { '200': { description: 'Import result' }, '400': { description: 'Invalid CSV' }, '422': { description: 'Invalid fields' } } } },
    '/answers': { post: { summary: 'Check an answer', responses: { '200': { description: 'Answer feedback' }, '404': { description: 'Child or question not found' }, '422': { description: 'Invalid input' } } } },
  },
};