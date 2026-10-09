import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { carregarGrafo, classesExportadasComExecute, SRC } from './support/grafo';
import { ehArquivoDeCasoDeUso } from './support/regras';

/** Regra h: convenções de Vertical Slice (um caso de uso + um controller por fatia). */
const { arquivos } = carregarGrafo();
const arquivosDeCasoDeUso = arquivos.filter(ehArquivoDeCasoDeUso);

const pastasDeFeatures = (): string[] =>
  readdirSync(join(SRC, 'modules')).flatMap((modulo) => {
    const features = join(SRC, 'modules', modulo, 'features');
    try {
      return readdirSync(features)
        .filter((fatia) => statSync(join(features, fatia)).isDirectory())
        .map((fatia) => `modules/${modulo}/features/${fatia}`);
    } catch {
      return [];
    }
  });

describe('Arquitetura: convenções (h)', () => {
  it('existem casos de uso e fatias a verificar', () => {
    expect(arquivosDeCasoDeUso.length).toBeGreaterThan(0);
    expect(pastasDeFeatures().length).toBeGreaterThan(0);
  });

  it('todo *UseCase.ts está dentro de modules/<m>/features/<fatia>/', () => {
    const foraDoLugar = arquivosDeCasoDeUso.filter((a) => !/^modules\/[^/]+\/features\/[^/]+\/[^/]+UseCase\.ts$/.test(a));
    expect(foraDoLugar).toBeSemViolacoes('*UseCase.ts fica em features/<fatia>/');
  });

  it('todo *UseCase.ts exporta uma classe com método execute', () => {
    const semExecute = arquivosDeCasoDeUso.filter(
      (a) => classesExportadasComExecute(readFileSync(join(SRC, a), 'utf8'), a).length === 0,
    );
    expect(semExecute).toBeSemViolacoes('*UseCase.ts exporta uma classe com execute()');
  });

  it('toda pasta em features/ contém exatamente um *UseCase.ts e um *Controller.ts', () => {
    const problemas = pastasDeFeatures().flatMap((fatia) => {
      const daFatia = arquivos.filter((a) => a.startsWith(`${fatia}/`));
      const casosDeUso = daFatia.filter(ehArquivoDeCasoDeUso).length;
      const controllers = daFatia.filter((a) => /[^/]+Controller\.ts$/.test(a)).length;
      return casosDeUso === 1 && controllers === 1
        ? []
        : [`${fatia} (UseCase: ${casosDeUso}, Controller: ${controllers})`];
    });
    expect(problemas).toBeSemViolacoes('uma fatia = um *UseCase.ts + um *Controller.ts');
  });

  it('não usa any explícito', () => {
    const comAny = arquivos.filter((a) =>
      /(:\s*any\b|\bas\s+any\b|<any>|any\[\])/.test(readFileSync(join(SRC, a), 'utf8')),
    );
    expect(comAny).toBeSemViolacoes('sem any');
  });
});
