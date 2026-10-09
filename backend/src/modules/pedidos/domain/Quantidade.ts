import { ValidationError } from '../../../shared/domain/errors';

/** Quantidade de um item do pedido: sempre um inteiro maior que zero. */
export class Quantidade {
  static readonly MENSAGEM_INVALIDA = 'A "quantidade" de cada item deve ser um inteiro maior que zero';

  private constructor(public readonly valor: number) {}

  static criar(valor: number): Quantidade {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new ValidationError(Quantidade.MENSAGEM_INVALIDA);
    }
    return new Quantidade(valor);
  }
}
