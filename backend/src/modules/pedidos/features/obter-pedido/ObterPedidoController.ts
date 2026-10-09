import { UseCase } from '../../../../shared/application/UseCase';
import { HttpController, HttpRequest, HttpResponse, ok } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { ObterPedidoInput } from './ObterPedidoUseCase';

export class ObterPedidoController implements HttpController {
  constructor(private readonly useCase: UseCase<ObterPedidoInput, PedidoDTO>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return ok(await this.useCase.execute({ pedidoId: request.params.id }));
  }
}
