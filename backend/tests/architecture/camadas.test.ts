import { carregarGrafo } from './support/grafo';
import { REGRAS, verificar } from './support/regras';

/** Regras de camadas (Clean Architecture): a, b, borda HTTP (express) e c. */
const { arquivos, importacoes } = carregarGrafo();

describe('Arquitetura: camadas', () => {
  it('lê os arquivos e os imports de src/', () => {
    expect(arquivos.length).toBeGreaterThan(40);
    expect(importacoes.length).toBeGreaterThan(100);
  });

  it('todo import relativo resolve para um arquivo .ts existente', () => {
    const naoResolvidos = importacoes.filter((i) => !i.externo && !i.alvo.endsWith('.ts'));
    expect(naoResolvidos.map((i) => `${i.arquivo} -> ${i.alvo}`)).toBeSemViolacoes('imports relativos resolvíveis');
  });

  it.each([
    { regra: REGRAS.dominio },
    { regra: REGRAS.casoDeUso },
    { regra: REGRAS.expressSoNaBorda },
    { regra: REGRAS.infraSoNoCompositionRoot },
    { regra: REGRAS.featuresSemInfra },
  ])('($regra.id) $regra.descricao', ({ regra }) => {
    expect(verificar(importacoes, regra)).toBeSemViolacoes(regra.descricao);
  });
});
