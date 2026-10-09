import { UseCase } from '../../../../shared/application/UseCase';
import { created, HttpController, HttpRequest, HttpResponse } from '../../../../shared/http/HttpController';
import { ClienteDTO } from '../../application/ClienteDTO';
import { CadastrarClienteInput } from './cadastrar-cliente.dto';

export class CadastrarClienteController implements HttpController {
  constructor(private readonly useCase: UseCase<CadastrarClienteInput, ClienteDTO>) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { nome, email } = request.body;
    return created(await this.useCase.execute({ nome, email }));
  }
}
