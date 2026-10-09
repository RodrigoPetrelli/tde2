import { UseCase } from '../../../../shared/application/UseCase';
import { created, HttpController, HttpRequest, HttpResponse } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { CriarPedidoInput } from './criar-pedido.dto';

export class CriarPedidoController implements HttpController {
  constructor(private readonly useCase: UseCase<CriarPedidoInput, PedidoDTO>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { clienteId, restauranteId, itens } = request.body;
    return created(await this.useCase.execute({ clienteId, restauranteId, itens }));
  }
}
