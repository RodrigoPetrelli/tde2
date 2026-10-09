/**
 * Erros de domínio. Não conhecem HTTP: a tradução para status code
 * acontece em `shared/http/errorHandler.ts`.
 */
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Dados de entrada inválidos (formato ou invariante violada). */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/** Recurso referenciado não existe. */
export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/** Operação válida em formato, mas proibida pelas regras de negócio. */
export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
