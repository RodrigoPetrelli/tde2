import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { ClienteDTO } from '../../application/ClienteDTO';
import { CadastrarClienteController } from './CadastrarClienteController';
import { CadastrarClienteInput } from './cadastrar-cliente.dto';

export function cadastrarClienteRoute(useCase: UseCase<CadastrarClienteInput, ClienteDTO>): HttpRoute {
  return { method: 'post', path: '/clientes', controller: new CadastrarClienteController(useCase) };
}
