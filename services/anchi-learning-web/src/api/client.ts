import type { Child, Question, Subject } from '@anchi/shared';
import { listChildAnswers } from '../progress/progressStore';
import type { ApiClient, CreateQuestionInput, ImportQuestionsResult, LearningPath, QuestionFilter, RecentProgress } from './types';

interface ErrorPayload {
  error?: { message?: string };
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${apiBaseUrl}/api${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null) as T | ErrorPayload | null;
  if (!response.ok) {
    const errorPayload = payload as ErrorPayload | null;
    throw new Error(errorPayload?.error?.message ?? `Request failed with status ${response.status}.`);
  }
  return payload as T;
}

async function getChildren(): Promise<Child[]> {
  const response = await request<{ children: Child[] }>('/children');
  return response.children;
}

async function getQuestions(filter: QuestionFilter = {}): Promise<Question[]> {
  const params = new URLSearchParams();
  if (filter.subject) params.set('subject', filter.subject);
  if (filter.age !== undefined) params.set('age', String(filter.age));
  const query = params.size ? `?${params.toString()}` : '';
  const response = await request<{ questions: Question[] }>(`/questions${query}`);
  return response.questions;
}

function streakLength(answeredAt: string[]): number {
  const days = [...new Set(answeredAt.map(value => value.slice(0, 10)))].sort().reverse();
  if (!days.length) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const mostRecent = Date.parse(`${days[0]}T00:00:00Z`);
  if (today.getTime() - mostRecent > 24 * 60 * 60 * 1000) return 0;

  let count = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = Date.parse(`${days[index - 1]}T00:00:00Z`);
    const current = Date.parse(`${days[index]}T00:00:00Z`);
    if (previous - current !== 24 * 60 * 60 * 1000) break;
    count += 1;
  }
  return count;
}

async function childAnswers(childId: string) {
  try {
    return await listChildAnswers(childId);
  } catch {
    return [];
  }
}

async function listLearningPaths(): Promise<LearningPath[]> {
  const [children, questions] = await Promise.all([getChildren(), getQuestions()]);
  const answersByChild = await Promise.all(children.map(child => childAnswers(child.id)));

  return children.flatMap((child, childIndex) => {
    const correctQuestionIds = new Set(answersByChild[childIndex].filter(answer => answer.correct).map(answer => answer.questionId));
    return (['math', 'vietnamese'] as const).flatMap(subject => {
      const subjectQuestions = questions.filter(question => question.subject === subject);
      if (!subjectQuestions.length) return [];
      const closestAge = Math.min(...subjectQuestions.map(question => Math.abs(question.age - child.age)));
      const pathQuestions = subjectQuestions.filter(question => Math.abs(question.age - child.age) === closestAge);
      const currentIndex = pathQuestions.findIndex(question => !correctQuestionIds.has(question.id));
      const nodes = pathQuestions.map((question, index) => ({
        title: question.prompt,
        state: correctQuestionIds.has(question.id) ? 'done' as const : index === currentIndex ? 'current' as const : 'upcoming' as const,
      }));

      return [{
        id: `${child.id}:${subject}`,
        childId: child.id,
        subject,
        title: subject === 'math' ? 'Toán' : 'Tiếng Việt',
        completed: nodes.filter(node => node.state === 'done').length,
        total: pathQuestions.length,
        nodes,
      }];
    });
  });
}

async function listRecentProgress(): Promise<RecentProgress[]> {
  const [children, questions] = await Promise.all([getChildren(), getQuestions()]);
  const subjectByQuestionId = new Map(questions.map(question => [question.id, question.subject]));
  const answersByChild = await Promise.all(children.map(child => childAnswers(child.id)));

  return children.flatMap((child, childIndex) => {
    const bySubject = new Map<Subject, typeof answersByChild[number]>();
    for (const answer of answersByChild[childIndex]) {
      const subject = subjectByQuestionId.get(answer.questionId);
      if (!subject) continue;
      bySubject.set(subject, [...(bySubject.get(subject) ?? []), answer]);
    }
    return [...bySubject.entries()].map(([subject, answers]) => ({
      childId: child.id,
      childName: child.name,
      subject,
      correct: answers.filter(answer => answer.correct).length,
      total: answers.length,
      streakDays: streakLength(answers.map(answer => answer.answeredAt)),
    }));
  });
}

export const liveClient: ApiClient = {
  health: () => request('/health'),
  listChildren: getChildren,
  createChild: async input => (await request<{ child: Child }>('/children', { method: 'POST', body: JSON.stringify(input) })).child,
  updateChild: async (childId, input) => (await request<{ child: Child }>(`/children/${encodeURIComponent(childId)}`, { method: 'PATCH', body: JSON.stringify(input) })).child,
  listLearningPaths,
  listRecentProgress,
  listQuestions: getQuestions,
  createQuestion: async (input: CreateQuestionInput) => (await request<{ question: Question }>('/questions', { method: 'POST', body: JSON.stringify(input) })).question,
  updateQuestion: async (questionId, input) => (await request<{ question: Question }>(`/questions/${encodeURIComponent(questionId)}`, { method: 'PATCH', body: JSON.stringify(input) })).question,
  deleteQuestion: questionId => request(`/questions/${encodeURIComponent(questionId)}`, { method: 'DELETE' }),
  importQuestions: async ({ file, subject, ageRange }) => {
    const form = new FormData();
    form.append('file', file);
    form.append('subject', subject);
    form.append('ageRange', ageRange);
    return request<ImportQuestionsResult>('/questions/import', { method: 'POST', body: form });
  },
  checkAnswer: async ({ childId, questionId, answer }) => request('/answers', {
    method: 'POST',
    body: JSON.stringify({ childId, questionId, answer }),
  }),
};