import { ValidationError } from '../../../../../../src/shared/domain/errors';
import { Restaurante } from '../../../../../../src/modules/restaurantes/domain/Restaurante';
import { CadastrarRestauranteUseCase } from '../../../../../../src/modules/restaurantes/features/cadastrar-restaurante/CadastrarRestauranteUseCase';
import { FakeRestauranteRepository, SequentialIdGenerator } from '../../../../fakes';

function montar() {
  const restaurantes = new FakeRestauranteRepository();
  return { restaurantes, useCase: new CadastrarRestauranteUseCase(restaurantes, new SequentialIdGenerator('rest')) };
}

describe('CadastrarRestauranteUseCase', () => {
  it('cadastra o restaurante com id gerado e campos normalizados', async () => {
    const { useCase, restaurantes } = montar();

    const saida = await useCase.execute({ nome: ' Cantina ', categoria: ' Italiana ' });

    expect(saida).toMatchObject({ id: 'rest-1', nome: 'Cantina', categoria: 'Italiana' });
    expect(new Date(saida.criadoEm).toISOString()).toBe(saida.criadoEm);
    expect(restaurantes.restaurantes).toHaveLength(1);
    expect(restaurantes.restaurantes[0]).toBeInstanceOf(Restaurante);
  });

  it('gera um id novo a cada cadastro', async () => {
    const { useCase } = montar();

    const a = await useCase.execute({ nome: 'A', categoria: 'X' });
    const b = await useCase.execute({ nome: 'B', categoria: 'X' });

    expect([a.id, b.id]).toEqual(['rest-1', 'rest-2']);
  });

  it.each([
    ['nome ausente', { categoria: 'Italiana' }, 'O campo "nome" é obrigatório'],
    ['nome em branco', { nome: '  ', categoria: 'Italiana' }, 'O campo "nome" é obrigatório'],
    ['categoria ausente', { nome: 'Cantina' }, 'O campo "categoria" é obrigatório'],
    ['categoria não textual', { nome: 'Cantina', categoria: 10 }, 'O campo "categoria" é obrigatório'],
  ])('rejeita %s com ValidationError sem salvar', async (_caso, input, mensagem) => {
    const { useCase, restaurantes } = montar();

    await expect(useCase.execute(input)).rejects.toThrow(new ValidationError(mensagem));
    expect(restaurantes.restaurantes).toHaveLength(0);
  });
});
