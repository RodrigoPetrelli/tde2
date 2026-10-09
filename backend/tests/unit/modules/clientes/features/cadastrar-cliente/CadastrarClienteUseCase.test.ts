import { BusinessRuleError, ValidationError } from '../../../../../../src/shared/domain/errors';
import { Cliente } from '../../../../../../src/modules/clientes/domain/Cliente';
import { ClienteRepository } from '../../../../../../src/modules/clientes/domain/ClienteRepository';
import { CadastrarClienteUseCase } from '../../../../../../src/modules/clientes/features/cadastrar-cliente/CadastrarClienteUseCase';
import { InMemoryClienteRepository } from '../../../../../../src/modules/clientes/infrastructure/InMemoryClienteRepository';
import { FakeClienteRepository, SequentialIdGenerator } from '../../../../fakes';

/** LSP: o caso de uso se comporta igual com qualquer implementação de ClienteRepository. */
const implementacoes: Array<[string, () => ClienteRepository]> = [
  ['FakeClienteRepository', () => new FakeClienteRepository()],
  ['InMemoryClienteRepository', () => new InMemoryClienteRepository()],
];

describe.each(implementacoes)('CadastrarClienteUseCase (com %s)', (_nome, criarRepositorio) => {
  function montar() {
    const clientes = criarRepositorio();
    return { clientes, useCase: new CadastrarClienteUseCase(clientes, new SequentialIdGenerator('cli')) };
  }

  it('cadastra o cliente com id gerado e e-mail normalizado', async () => {
    const { useCase, clientes } = montar();

    const saida = await useCase.execute({ nome: ' Maria ', email: ' Maria@Exemplo.com ' });

    expect(saida).toMatchObject({ id: 'cli-1', nome: 'Maria', email: 'maria@exemplo.com' });
    expect(new Date(saida.criadoEm).toISOString()).toBe(saida.criadoEm);
    expect(await clientes.buscarPorId('cli-1')).toBeInstanceOf(Cliente);
  });

  it.each(['maria@exemplo.com', ' MARIA@EXEMPLO.COM '])(
    'rejeita e-mail duplicado (%p) com BusinessRuleError sem sobrescrever o cliente existente',
    async (emailDuplicado) => {
      const { useCase, clientes } = montar();
      await useCase.execute({ nome: 'Maria', email: 'maria@exemplo.com' });
      const salvar = jest.spyOn(clientes, 'salvar');

      await expect(useCase.execute({ nome: 'Outra Maria', email: emailDuplicado })).rejects.toThrow(
        new BusinessRuleError('Já existe um cliente cadastrado com este e-mail'),
      );
      expect(salvar).not.toHaveBeenCalled();
      expect((await clientes.buscarPorEmail('maria@exemplo.com'))?.nome).toBe('Maria');
    },
  );

  it.each([
    ['e-mail inválido', { nome: 'Maria', email: 'maria@' }, Cliente.MENSAGEM_EMAIL_INVALIDO],
    ['e-mail ausente', { nome: 'Maria' }, Cliente.MENSAGEM_EMAIL_INVALIDO],
    ['e-mail não textual', { nome: 'Maria', email: 123 }, Cliente.MENSAGEM_EMAIL_INVALIDO],
    ['nome ausente', { email: 'maria@exemplo.com' }, 'O campo "nome" é obrigatório'],
    ['nome em branco', { nome: '   ', email: 'maria@exemplo.com' }, 'O campo "nome" é obrigatório'],
  ])('rejeita %s com ValidationError sem salvar', async (_caso, input, mensagem) => {
    const { useCase, clientes } = montar();
    const salvar = jest.spyOn(clientes, 'salvar');

    await expect(useCase.execute(input)).rejects.toThrow(new ValidationError(mensagem));
    expect(salvar).not.toHaveBeenCalled();
  });
});
