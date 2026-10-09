import { Entity } from '../../../shared/domain/Entity';
import { ValidationError } from '../../../shared/domain/errors';

export interface CriarClienteProps {
  id: string;
  nome: string;
  email: string;
}

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Cliente da plataforma. Invariantes: nome preenchido e e-mail válido, sempre normalizado em minúsculas. */
export class Cliente extends Entity {
  static readonly MENSAGEM_EMAIL_INVALIDO = 'O campo "email" deve ser um e-mail válido';

  private constructor(
    id: string,
    public readonly nome: string,
    public readonly email: string,
    public readonly criadoEm: Date,
  ) {
    super(id);
  }

  static criar(props: CriarClienteProps, agora: Date = new Date()): Cliente {
    const nome = props.nome.trim();
    if (nome === '') {
      throw new ValidationError('O campo "nome" é obrigatório');
    }
    return new Cliente(props.id, nome, Cliente.normalizarEmail(props.email), agora);
  }

  private static normalizarEmail(email: string): string {
    const normalizado = email.trim();
    if (!FORMATO_EMAIL.test(normalizado)) {
      throw new ValidationError(Cliente.MENSAGEM_EMAIL_INVALIDO);
    }
    return normalizado.toLowerCase();
  }
}
