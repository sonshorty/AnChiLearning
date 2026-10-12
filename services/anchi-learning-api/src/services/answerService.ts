import type { QuestionsService } from './questionsService.js';

export class AnswerService {
  constructor(private readonly questions: QuestionsService) {}

  check(questionId: string, answer: string): { correct: boolean; expectedAnswer: string; progress: number } {
    const question = this.questions.find(questionId);
    const correct = question.answer.trim().toLocaleLowerCase('vi') === answer.trim().toLocaleLowerCase('vi');
    return { correct, expectedAnswer: question.answer, progress: correct ? 1 : 0 };
  }
}