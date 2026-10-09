import { UseCase } from '../../../../shared/application/UseCase';
import { HttpController, HttpRequest, HttpResponse, ok } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { ConfirmarPedidoInput } from './ConfirmarPedidoUseCase';

export class ConfirmarPedidoController implements HttpController {
  constructor(private readonly useCase: UseCase<ConfirmarPedidoInput, PedidoDTO>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return ok(await this.useCase.execute({ pedidoId: request.params.id }));
  }
}
