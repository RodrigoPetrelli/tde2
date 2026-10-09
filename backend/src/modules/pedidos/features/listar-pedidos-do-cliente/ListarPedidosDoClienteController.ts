import { UseCase } from '../../../../shared/application/UseCase';
import { HttpController, HttpRequest, HttpResponse, ok } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { ListarPedidosDoClienteInput } from './ListarPedidosDoClienteUseCase';

export class ListarPedidosDoClienteController implements HttpController {
  constructor(private readonly useCase: UseCase<ListarPedidosDoClienteInput, PedidoDTO[]>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return ok(await this.useCase.execute({ clienteId: request.params.id }));
  }
}
