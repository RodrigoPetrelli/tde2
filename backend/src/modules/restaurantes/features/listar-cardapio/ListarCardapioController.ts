import { UseCase } from '../../../../shared/application/UseCase';
import { HttpController, HttpRequest, HttpResponse, ok } from '../../../../shared/http/HttpController';
import { ProdutoDTO } from '../../application/RestaurantesDTO';
import { ListarCardapioInput } from './ListarCardapioUseCase';

export class ListarCardapioController implements HttpController {
  constructor(private readonly useCase: UseCase<ListarCardapioInput, ProdutoDTO[]>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return ok(await this.useCase.execute({ restauranteId: request.params.id }));
  }
}
