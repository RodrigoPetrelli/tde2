import { UseCase } from '../../../../shared/application/UseCase';
import { created, HttpController, HttpRequest, HttpResponse } from '../../../../shared/http/HttpController';
import { RestauranteDTO } from '../../application/RestaurantesDTO';
import { CadastrarRestauranteInput } from './cadastrar-restaurante.dto';

export class CadastrarRestauranteController implements HttpController {
  constructor(private readonly useCase: UseCase<CadastrarRestauranteInput, RestauranteDTO>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { nome, categoria } = request.body;
    return created(await this.useCase.execute({ nome, categoria }));
  }
}
