import { UseCase } from '../../../../shared/application/UseCase';
import { HttpController, HttpRequest, HttpResponse, ok } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { CancelarPedidoInput } from './CancelarPedidoUseCase';

export class CancelarPedidoController implements HttpController {
  constructor(private readonly useCase: UseCase<CancelarPedidoInput, PedidoDTO>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return ok(await this.useCase.execute({ pedidoId: request.params.id }));
  }
}
