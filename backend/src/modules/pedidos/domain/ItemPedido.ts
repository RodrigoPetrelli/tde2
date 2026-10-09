import { BusinessRuleError } from '../../../shared/domain/errors';
import { Money } from '../../../shared/domain/Money';
import { ProdutoDoCatalogo } from './ProdutoDoCatalogo';
import { Quantidade } from './Quantidade';

export interface CriarItemPedidoProps {
  produto: ProdutoDoCatalogo;
  quantidade: Quantidade;
}

/** Item (objeto de valor) do agregado Pedido: congela nome e preço do produto no momento da compra. */
export class ItemPedido {
  private constructor(
    public readonly produtoId: string,
    public readonly nome: string,
    public readonly quantidade: Quantidade,
    public readonly precoUnitario: Money,
  ) {}

  static criar({ produto, quantidade }: CriarItemPedidoProps): ItemPedido {
    if (!produto.pertenceAoRestaurante) {
      throw new BusinessRuleError(`O produto "${produto.nome}" não pertence ao restaurante informado`);
    }
    if (!produto.disponivel) {
      throw new BusinessRuleError(`O produto "${produto.nome}" não está disponível`);
    }
    return new ItemPedido(produto.id, produto.nome, quantidade, Money.deCentavos(produto.precoCentavos));
  }

  get subtotal(): Money {
    return this.precoUnitario.multiplicar(this.quantidade.valor);
  }
}
