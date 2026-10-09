import { UseCase } from '../../shared/application/UseCase';
import { HttpRouter, montarRouter } from '../../shared/http/expressAdapter';
import { ClienteDTO } from './application/ClienteDTO';
import { cadastrarClienteRoute } from './features/cadastrar-cliente/cadastrar-cliente.route';
import { CadastrarClienteInput } from './features/cadastrar-cliente/cadastrar-cliente.dto';

/** Casos de uso que o módulo expõe via HTTP (instanciados no composition root). */
export interface ClientesUseCases {
  cadastrarCliente: UseCase<CadastrarClienteInput, ClienteDTO>;
}

export function clientesModule(useCases: ClientesUseCases): HttpRouter {
  return montarRouter([cadastrarClienteRoute(useCases.cadastrarCliente)]);
}
