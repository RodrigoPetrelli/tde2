import { Entity } from '../../../shared/domain/Entity';
import { ValidationError } from '../../../shared/domain/errors';

export interface CriarRestauranteProps {
  id: string;
  nome: string;
  categoria: string;
}

export class Restaurante extends Entity {
  private constructor(
    id: string,
    public readonly nome: string,
    public readonly categoria: string,
    public readonly criadoEm: Date,
  ) {
    super(id);
  }

  static criar(props: CriarRestauranteProps, agora: Date = new Date()): Restaurante {
    const nome = props.nome.trim();
    const categoria = props.categoria.trim();
    if (nome === '') {
      throw new ValidationError('O campo "nome" é obrigatório');
    }
    if (categoria === '') {
      throw new ValidationError('O campo "categoria" é obrigatório');
    }
    return new Restaurante(props.id, nome, categoria, agora);
  }
}
