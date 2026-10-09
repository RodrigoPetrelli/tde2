import { IdGenerator } from '../../../../shared/application/IdGenerator';
import { UseCase } from '../../../../shared/application/UseCase';
import { BusinessRuleError } from '../../../../shared/domain/errors';
import { ClienteDTO, paraClienteDTO } from '../../application/ClienteDTO';
import { Cliente } from '../../domain/Cliente';
import { ClienteRepository } from '../../domain/ClienteRepository';
import { CadastrarClienteInput, validarCadastrarCliente } from './cadastrar-cliente.dto';

export class CadastrarClienteUseCase implements UseCase<CadastrarClienteInput, ClienteDTO> {
  constructor(
    private readonly clientes: ClienteRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CadastrarClienteInput): Promise<ClienteDTO> {
    const dados = validarCadastrarCliente(input);
    const cliente = Cliente.criar({ id: this.ids.gerar(), ...dados });

    if (await this.clientes.buscarPorEmail(cliente.email)) {
      throw new BusinessRuleError('Já existe um cliente cadastrado com este e-mail');
    }

    await this.clientes.salvar(cliente);
    return paraClienteDTO(cliente);
  }
}
