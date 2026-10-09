/** Porta usada pela notificação de pedidos para obter dados de exibição do restaurante. */
export interface RestauranteInfoGateway {
  obterNomeDoRestaurante(restauranteId: string): Promise<string | null>;
}
