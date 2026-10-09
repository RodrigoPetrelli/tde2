import { randomUUID } from 'crypto';
import { IdGenerator } from '../application/IdGenerator';

export class CryptoIdGenerator implements IdGenerator {
  gerar(): string {
    return randomUUID();
  }
}
