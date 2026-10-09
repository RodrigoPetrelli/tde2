import { carregarGrafo } from './support/grafo';
import { ehExcecaoDocumentada, REGRAS, verificar } from './support/regras';

/** Regras de Vertical Slice e de isolamento entre módulos/shared/main: d, e, f, g. */
const { importacoes } = carregarGrafo();

describe('Arquitetura: fatias, módulos, shared e main', () => {
  it.each([
    { regra: REGRAS.fatiasIsoladas },
    { regra: REGRAS.modulosIsolados },
    { regra: REGRAS.modulosSemAcoplamentoDireto },
    { regra: REGRAS.sharedIndependente },
    { regra: REGRAS.ninguemImportaMain },
  ])('($regra.id) $regra.descricao', ({ regra }) => {
    expect(verificar(importacoes, regra)).toBeSemViolacoes(regra.descricao);
  });

  it('(e) a exceção documentada está restrita aos adaptadores de gateway de pedidos', () => {
    const usos = importacoes.filter(ehExcecaoDocumentada).map((i) => `${i.arquivo} -> ${i.alvo}`);
    expect(usos.sort()).toEqual([
      'modules/pedidos/infrastructure/CatalogoGatewayAdapter.ts -> modules/restaurantes/domain/RestauranteRepository.ts',
      'modules/pedidos/infrastructure/ClienteGatewayAdapter.ts -> modules/clientes/domain/ClienteRepository.ts',
    ]);
  });
});
