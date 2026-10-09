import { UseCase } from '../../../../shared/application/UseCase';
import { created, HttpController, HttpRequest, HttpResponse } from '../../../../shared/http/HttpController';
import { ProdutoDTO } from '../../application/RestaurantesDTO';
import { AdicionarProdutoInput } from './adicionar-produto.dto';

export class AdicionarProdutoController implements HttpController {
  constructor(private readonly useCase: UseCase<AdicionarProdutoInput, ProdutoDTO>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { nome, precoCentavos, disponivel } = request.body;
    const produto = await this.useCase.execute({
      restauranteId: request.params.id,
      nome,
      precoCentavos,
      disponivel,
    });
    return created(produto);
  }
}
