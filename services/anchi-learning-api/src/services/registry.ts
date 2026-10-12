import { AnswerService } from './answerService.js';
import { ChildrenService } from './childrenService.js';
import { QuestionsService } from './questionsService.js';

export interface AppServices {
  children: ChildrenService;
  questions: QuestionsService;
  answers: AnswerService;
}

export function createServices(): AppServices {
  const children = new ChildrenService();
  const questions = new QuestionsService();
  return { children, questions, answers: new AnswerService(questions) };
}