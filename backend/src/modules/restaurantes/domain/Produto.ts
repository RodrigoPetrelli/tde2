import { Entity } from '../../../shared/domain/Entity';
import { ValidationError } from '../../../shared/domain/errors';
import { Money } from '../../../shared/domain/Money';

export interface CriarProdutoProps {
  id: string;
  restauranteId: string;
  nome: string;
  precoCentavos: number;
  disponivel?: boolean;
}

/** Item do cardápio de um restaurante. Invariantes: nome preenchido e preço inteiro > 0. */
export class Produto extends Entity {
  static readonly MENSAGEM_PRECO_INVALIDO = 'O campo "precoCentavos" deve ser um inteiro maior que zero';

  private constructor(
    id: string,
    public readonly restauranteId: string,
    public readonly nome: string,
    public readonly preco: Money,
    public readonly disponivel: boolean,
    public readonly criadoEm: Date,
  ) {
    super(id);
  }

  static criar(props: CriarProdutoProps, agora: Date = new Date()): Produto {
    const nome = props.nome.trim();
    if (nome === '') {
      throw new ValidationError('O campo "nome" é obrigatório');
    }
    if (!Number.isInteger(props.precoCentavos) || props.precoCentavos <= 0) {
      throw new ValidationError(Produto.MENSAGEM_PRECO_INVALIDO);
    }
    return new Produto(
      props.id,
      props.restauranteId,
      nome,
      Money.deCentavos(props.precoCentavos),
      props.disponivel ?? true,
      agora,
    );
  }

  pertenceAo(restauranteId: string): boolean {
    return this.restauranteId === restauranteId;
  }
}
