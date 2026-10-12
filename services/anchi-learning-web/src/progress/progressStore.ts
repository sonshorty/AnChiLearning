export interface AnswerRecord {
  id: string;
  childId: string;
  questionId: string;
  correct: boolean;
  answeredAt: string;
}

const databaseName = 'anchi-learning-progress';
const storeName = 'answers';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        const store = database.createObjectStore(storeName, { keyPath: 'id' });
        store.createIndex('childId', 'childId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local progress storage.'));
  });
}

export async function recordAnswer(input: Omit<AnswerRecord, 'id' | 'answeredAt'>): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put({
      ...input,
      id: `${input.childId}:${input.questionId}:${Date.now()}`,
      answeredAt: new Date().toISOString(),
    } satisfies AnswerRecord);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save local progress.'));
  });
  database.close();
}

export async function listChildAnswers(childId: string): Promise<AnswerRecord[]> {
  const database = await openDatabase();
  const records = await new Promise<AnswerRecord[]>((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).index('childId').getAll(childId);
    request.onsuccess = () => resolve(request.result as AnswerRecord[]);
    request.onerror = () => reject(request.error ?? new Error('Could not read local progress.'));
  });
  database.close();
  return records;
}