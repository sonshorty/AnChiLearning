import type { CreateQuestionInput, Question, QuestionFilter, UpdateQuestionInput } from '../contracts.js';
import { AppError } from '../errors/appError.js';

function toQuestion(id: string, input: CreateQuestionInput): Question {
  const format = input.choices ? 'multiple-choice' : input.subject === 'vietnamese' && input.prompt.toLocaleLowerCase('vi').includes('điền') ? 'missing-letter' : 'typed';
  return { ...input, id, format };
}

export class QuestionsService {
  private readonly questions: Question[] = [];

  list(filter: QuestionFilter = {}): Question[] {
    return this.questions
      .filter(question => (!filter.subject || question.subject === filter.subject) && (!filter.age || question.age === filter.age))
      .map(question => ({ ...question, choices: question.choices ? [...question.choices] : undefined }));
  }

  find(questionId: string): Question {
    const question = this.questions.find(item => item.id === questionId);
    if (!question) throw new AppError(404, 'NOT_FOUND', 'Question was not found.');
    return question;
  }

  create(input: CreateQuestionInput): Question {
    const question = toQuestion(`question-${crypto.randomUUID()}`, input);
    this.questions.push(question);
    return { ...question };
  }

  createMany(inputs: CreateQuestionInput[]): Question[] {
    return inputs.map(input => this.create(input));
  }

  update(questionId: string, input: UpdateQuestionInput): Question {
    const current = this.find(questionId);
    Object.assign(current, input);
    current.format = current.choices ? 'multiple-choice' : current.subject === 'vietnamese' && current.prompt.toLocaleLowerCase('vi').includes('điền') ? 'missing-letter' : 'typed';
    return { ...current, choices: current.choices ? [...current.choices] : undefined };
  }

  remove(questionId: string): void {
    const index = this.questions.findIndex(item => item.id === questionId);
    if (index < 0) throw new AppError(404, 'NOT_FOUND', 'Question was not found.');
    this.questions.splice(index, 1);
  }
}