import { UseCase } from '../../../../shared/application/UseCase';
import { HttpController, HttpResponse, ok } from '../../../../shared/http/HttpController';
import { RestauranteDTO } from '../../application/RestaurantesDTO';

export class ListarRestaurantesController implements HttpController {
  constructor(private readonly useCase: UseCase<void, RestauranteDTO[]>) {}

  async handle(): Promise<HttpResponse> {
    return ok(await this.useCase.execute());
  }
}
