import { Restaurante } from '../../../../../../src/modules/restaurantes/domain/Restaurante';
import { RestauranteRepository } from '../../../../../../src/modules/restaurantes/domain/RestauranteRepository';
import { ListarRestaurantesUseCase } from '../../../../../../src/modules/restaurantes/features/listar-restaurantes/ListarRestaurantesUseCase';
import { InMemoryRestauranteRepository } from '../../../../../../src/modules/restaurantes/infrastructure/InMemoryRestauranteRepository';
import { FakeRestauranteRepository } from '../../../../fakes';

/** LSP: o caso de uso se comporta igual com qualquer implementação de RestauranteRepository. */
const implementacoes: Array<[string, () => RestauranteRepository]> = [
  ['FakeRestauranteRepository', () => new FakeRestauranteRepository()],
  ['InMemoryRestauranteRepository', () => new InMemoryRestauranteRepository()],
];

describe.each(implementacoes)('ListarRestaurantesUseCase (com %s)', (_nome, criarRepositorio) => {
  it('retorna lista vazia quando não há restaurantes', async () => {
    await expect(new ListarRestaurantesUseCase(criarRepositorio()).execute()).resolves.toEqual([]);
  });

  it('lista todos os restaurantes como DTO, na ordem de cadastro', async () => {
    const restaurantes = criarRepositorio();
    const criadoEm = new Date('2026-01-01T10:00:00.000Z');
    await restaurantes.salvar(Restaurante.criar({ id: 'r1', nome: 'Cantina', categoria: 'Italiana' }, criadoEm));
    await restaurantes.salvar(Restaurante.criar({ id: 'r2', nome: 'Sushi Bar', categoria: 'Japonesa' }, criadoEm));

    const saida = await new ListarRestaurantesUseCase(restaurantes).execute();

    expect(saida).toEqual([
      { id: 'r1', nome: 'Cantina', categoria: 'Italiana', criadoEm: criadoEm.toISOString() },
      { id: 'r2', nome: 'Sushi Bar', categoria: 'Japonesa', criadoEm: criadoEm.toISOString() },
    ]);
  });
});
