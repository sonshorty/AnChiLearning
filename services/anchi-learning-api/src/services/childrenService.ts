import type { Child, CreateChildInput, UpdateChildInput } from '../contracts.js';
import { AppError } from '../errors/appError.js';

export class ChildrenService {
  private readonly children: Child[] = [];

  list(): Child[] {
    return this.children.map(child => ({ ...child }));
  }

  create(input: CreateChildInput): Child {
    const child = { id: `child-${crypto.randomUUID()}`, ...input };
    this.children.push(child);
    return { ...child };
  }

  update(childId: string, input: UpdateChildInput): Child {
    const child = this.children.find(item => item.id === childId);
    if (!child) throw new AppError(404, 'NOT_FOUND', 'Child profile was not found.');
    Object.assign(child, input);
    return { ...child };
  }
}