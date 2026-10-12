import type { Child, Question, Subject } from '@anchi/shared';
import { listChildAnswers } from '../progress/progressStore';
import type { ApiClient, CreateQuestionInput, ImportQuestionsResult, LearningPath, QuestionFilter, RecentProgress } from './types';

const childrenKey = 'anchi-static-children';
const questionsKey = 'anchi-static-questions';

const initialChildren: Child[] = [
  { id: 'child-minh-anh', name: 'Minh Anh', age: 7 },
  { id: 'child-bao-an', name: 'Bảo An', age: 10 },
];

const initialQuestions: Question[] = [
  { id: 'math-1', subject: 'math', age: 7, prompt: '6 + 3 bằng bao nhiêu?', answer: '9', choices: ['7', '8', '9', '10'], format: 'multiple-choice' },
  { id: 'math-2', subject: 'math', age: 7, prompt: '12 - 5 bằng bao nhiêu?', answer: '7', choices: ['5', '6', '7', '8'], format: 'multiple-choice' },
  { id: 'math-3', subject: 'math', age: 10, prompt: '8 x 4 bằng bao nhiêu?', answer: '32', choices: ['24', '28', '32', '36'], format: 'multiple-choice' },
  { id: 'vietnamese-1', subject: 'vietnamese', age: 7, prompt: 'Từ nào viết đúng chính tả?', answer: 'chăm chỉ', choices: ['chăm chỉ', 'trăm chỉ', 'chăm chĩ'], format: 'multiple-choice' },
  { id: 'vietnamese-2', subject: 'vietnamese', age: 7, prompt: 'Từ trái nghĩa với “cao” là gì?', answer: 'thấp', choices: ['dài', 'thấp', 'rộng'], format: 'multiple-choice' },
  { id: 'vietnamese-3', subject: 'vietnamese', age: 10, prompt: 'Từ nào là danh từ?', answer: 'quyển sách', choices: ['đọc', 'nhanh', 'quyển sách'], format: 'multiple-choice' },
];

function readStored<T>(key: string, initial: T[]): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T[] : initial;
  } catch {
    return initial;
  }
}

function writeStored<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getChildren(): Child[] {
  return readStored(childrenKey, initialChildren);
}

function getQuestions(filter: QuestionFilter = {}): Question[] {
  return readStored(questionsKey, initialQuestions).filter(question =>
    (!filter.subject || question.subject === filter.subject) &&
    (filter.age === undefined || question.age === filter.age),
  );
}

function getStreak(answeredAt: string[]): number {
  const days = [...new Set(answeredAt.map(value => value.slice(0, 10)))].sort().reverse();
  if (!days.length) return 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (today.getTime() - Date.parse(`${days[0]}T00:00:00Z`) > 24 * 60 * 60 * 1000) return 0;
  let count = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (Date.parse(`${days[index - 1]}T00:00:00Z`) - Date.parse(`${days[index]}T00:00:00Z`) !== 24 * 60 * 60 * 1000) break;
    count += 1;
  }
  return count;
}

async function listLearningPaths(): Promise<LearningPath[]> {
  const children = getChildren();
  const questions = getQuestions();
  const answers = await Promise.all(children.map(child => listChildAnswers(child.id).catch(() => [])));
  return children.flatMap((child, childIndex) => (['math', 'vietnamese'] as const).flatMap(subject => {
    const subjectQuestions = questions.filter(question => question.subject === subject);
    if (!subjectQuestions.length) return [];
    const closestAge = Math.min(...subjectQuestions.map(question => Math.abs(question.age - child.age)));
    const pathQuestions = subjectQuestions.filter(question => Math.abs(question.age - child.age) === closestAge);
    const correctIds = new Set(answers[childIndex].filter(answer => answer.correct).map(answer => answer.questionId));
    const currentIndex = pathQuestions.findIndex(question => !correctIds.has(question.id));
    return [{
      id: `${child.id}:${subject}`,
      childId: child.id,
      subject,
      title: subject === 'math' ? 'Toán' : 'Tiếng Việt',
      completed: pathQuestions.filter(question => correctIds.has(question.id)).length,
      total: pathQuestions.length,
      nodes: pathQuestions.map((question, index) => ({
        title: question.prompt,
        state: correctIds.has(question.id) ? 'done' as const : index === currentIndex ? 'current' as const : 'upcoming' as const,
      })),
    }];
  }));
}

async function listRecentProgress(): Promise<RecentProgress[]> {
  const children = getChildren();
  const subjects = new Map(getQuestions().map(question => [question.id, question.subject]));
  const answers = await Promise.all(children.map(child => listChildAnswers(child.id).catch(() => [])));
  return children.flatMap((child, childIndex) => {
    const bySubject = new Map<Subject, typeof answers[number]>();
    for (const answer of answers[childIndex]) {
      const subject = subjects.get(answer.questionId);
      if (subject) bySubject.set(subject, [...(bySubject.get(subject) ?? []), answer]);
    }
    return [...bySubject.entries()].map(([subject, subjectAnswers]) => ({
      childId: child.id,
      childName: child.name,
      subject,
      correct: subjectAnswers.filter(answer => answer.correct).length,
      total: subjectAnswers.length,
      streakDays: getStreak(subjectAnswers.map(answer => answer.answeredAt)),
    }));
  });
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(value => value.length)) rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(value => value.length)) rows.push(row);
  return rows;
}

function makeQuestion(input: CreateQuestionInput): Question {
  return {
    ...input,
    id: `question-${crypto.randomUUID()}`,
    format: input.choices?.length ? 'multiple-choice' : 'typed',
  };
}

export const staticClient: ApiClient = {
  health: async () => ({ status: 'ok', services: { browserStorage: true } }),
  listChildren: async () => getChildren(),
  createChild: async input => {
    const children = getChildren();
    const child = { id: `child-${crypto.randomUUID()}`, ...input };
    writeStored(childrenKey, [...children, child]);
    return child;
  },
  updateChild: async (childId, input) => {
    const children = getChildren();
    const child = children.find(item => item.id === childId);
    if (!child) return null;
    Object.assign(child, input);
    writeStored(childrenKey, children);
    return child;
  },
  listLearningPaths,
  listRecentProgress,
  listQuestions: async filter => getQuestions(filter),
  createQuestion: async input => {
    const questions = getQuestions();
    const question = makeQuestion(input);
    writeStored(questionsKey, [...questions, question]);
    return question;
  },
  updateQuestion: async (questionId, input) => {
    const questions = getQuestions();
    const index = questions.findIndex(question => question.id === questionId);
    if (index < 0) throw new Error('Question was not found.');
    questions[index] = { ...questions[index], ...input };
    writeStored(questionsKey, questions);
    return questions[index];
  },
  deleteQuestion: async questionId => {
    const questions = getQuestions();
    const remaining = questions.filter(question => question.id !== questionId);
    if (remaining.length === questions.length) return null;
    writeStored(questionsKey, remaining);
    return { deleted: true };
  },
  importQuestions: async ({ file, subject, ageRange }) => {
    const rows = parseCsv(await file.text());
    if (rows[0]?.[0]?.toLocaleLowerCase() === 'subject') rows.shift();
    const defaultAge = Number.parseInt(ageRange, 10);
    const imported: Question[] = [];
    const results: ImportQuestionsResult['rows'] = rows.map((row, index) => {
      const [rowSubject, rowAge, prompt, answer, choiceText] = row;
      const questionSubject = rowSubject === 'math' || rowSubject === 'vietnamese' ? rowSubject : subject;
      const age = Number.parseInt(rowAge, 10) || defaultAge;
      if (!prompt || !answer || !Number.isFinite(age)) {
        return { row: index + 1, status: 'invalid', message: 'Thiếu câu hỏi, đáp án hoặc độ tuổi.' };
      }
      imported.push(makeQuestion({ subject: questionSubject, age, prompt, answer, choices: choiceText ? choiceText.split('|').map(choice => choice.trim()).filter(Boolean) : undefined }));
      return { row: index + 1, status: 'valid' };
    });
    writeStored(questionsKey, [...getQuestions(), ...imported]);
    return { imported: imported.length, rejected: results.filter(row => row.status === 'invalid').length, rows: results };
  },
  checkAnswer: async ({ questionId, answer }) => {
    const question = getQuestions().find(item => item.id === questionId);
    if (!question) return null;
    return { correct: answer.trim().toLocaleLowerCase() === question.answer.trim().toLocaleLowerCase(), expectedAnswer: question.answer, progress: 1 };
  },
};