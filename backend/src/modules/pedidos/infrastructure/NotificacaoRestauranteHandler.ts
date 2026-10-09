import { EventHandler } from '../../../shared/application/EventBus';
import { RestauranteInfoGateway } from '../application/ports/RestauranteInfoGateway';
import { PedidoCriado } from '../domain/events/PedidoCriado';

/** Simula o envio de uma notificação ao restaurante quando um pedido é criado. */
export class NotificacaoRestauranteHandler implements EventHandler<PedidoCriado> {
  constructor(private readonly restaurantes: RestauranteInfoGateway) {}

  async handle(evento: PedidoCriado): Promise<void> {
    const nome = (await this.restaurantes.obterNomeDoRestaurante(evento.restauranteId)) ?? evento.restauranteId;
    console.log(
      `[NOTIFICACAO] Notificação enviada ao restaurante "${nome}": novo pedido ${evento.pedidoId} ` +
        `(total: ${evento.totalCentavos} centavos)`,
    );
  }
}
