/**
 * Visão que o contexto de pedidos tem de um produto do cardápio
 * (modelo próprio, sem depender do domínio do módulo restaurantes).
 */
export interface ProdutoDoCatalogo {
  readonly id: string;
  readonly nome: string;
  readonly precoCentavos: number;
  readonly disponivel: boolean;
  /** Se o produto pertence ao restaurante do pedido. */
  readonly pertenceAoRestaurante: boolean;
}
