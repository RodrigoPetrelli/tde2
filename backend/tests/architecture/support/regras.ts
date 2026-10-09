import { Importacao } from './grafo';

/**
 * Regras de dependência da arquitetura (Clean Architecture + Vertical Slice +
 * isolamento entre módulos). Cada regra é um predicado puro sobre uma
 * importação: `violadaPor(i)` retorna true quando `i` desrespeita a regra.
 * Por serem puras, as regras podem ser exercitadas com imports fictícios
 * (ver sentinela.test.ts).
 */

export interface Regra {
  id: string;
  descricao: string;
  violadaPor(importacao: Importacao): boolean;
}

// ---------- helpers de caminho (todos relativos a src/, com "/") ----------

const ehExpress = (i: Importacao): boolean => i.externo && (i.alvo === 'express' || i.alvo.startsWith('express/'));

/** O caminho tem `nome` como diretório (ex.: temPasta('modules/x/domain/A.ts', 'domain')). */
const temPasta = (caminho: string, ...nomes: string[]): boolean =>
  caminho.split('/').slice(0, -1).some((segmento) => nomes.includes(segmento));

const alvoLocalEm = (i: Importacao, ...pastas: string[]): boolean => !i.externo && temPasta(i.alvo, ...pastas);

const nomeDoArquivo = (caminho: string): string => caminho.slice(caminho.lastIndexOf('/') + 1);

export const estaEm = (caminho: string, prefixo: string): boolean => caminho.startsWith(`${prefixo}/`);

/** Nome do módulo de negócio (modules/<m>/...) ou undefined. */
export const moduloDe = (caminho: string): string | undefined => /^modules\/([^/]+)\//.exec(caminho)?.[1];

/** Identificador da fatia (modules/<m>/features/<f>) ou undefined. */
export const fatiaDe = (caminho: string): string | undefined =>
  /^(modules\/[^/]+\/features\/[^/]+)\//.exec(caminho)?.[1];

/** "Unidade" dona de um arquivo: modules/<m>, ou o primeiro diretório (shared, main). */
const unidadeDe = (caminho: string): string => {
  const modulo = moduloDe(caminho);
  return modulo !== undefined ? `modules/${modulo}` : caminho.split('/')[0];
};

/** Um arquivo de caso de uso concreto: <Algo>UseCase.ts (o contrato genérico shared/application/UseCase.ts não conta). */
export const ehArquivoDeCasoDeUso = (caminho: string): boolean => /^.+UseCase\.ts$/.test(nomeDoArquivo(caminho));

// ---------- exceção documentada ao isolamento entre módulos ----------

/**
 * Adaptadores de gateway de `pedidos` (anti-corruption layer) podem importar
 * apenas o TIPO da interface de repositório do domínio de `restaurantes` e
 * `clientes`. A instância concreta é injetada por main/container.ts.
 */
export const ehExcecaoDocumentada = (i: Importacao): boolean =>
  i.somenteTipo &&
  /^modules\/pedidos\/infrastructure\/[^/]+GatewayAdapter\.ts$/.test(i.arquivo) &&
  /^modules\/(restaurantes|clientes)\/domain\/[^/]+Repository\.ts$/.test(i.alvo);

// ---------- regras ----------

export const REGRAS = {
  dominio: {
    id: 'a',
    descricao: '**/domain/** não importa express, application, infrastructure, features, http nem main',
    violadaPor: (i) =>
      temPasta(i.arquivo, 'domain') &&
      (ehExpress(i) || alvoLocalEm(i, 'application', 'infrastructure', 'features', 'http', 'main')),
  },
  casoDeUso: {
    id: 'b',
    descricao: '**/*UseCase.ts não importa express, infrastructure, http nem main',
    violadaPor: (i) =>
      ehArquivoDeCasoDeUso(i.arquivo) && (ehExpress(i) || alvoLocalEm(i, 'infrastructure', 'http', 'main')),
  },
  expressSoNaBorda: {
    id: 'a/b (borda HTTP)',
    descricao: 'express só é importado em shared/http/** e main/**',
    violadaPor: (i) => ehExpress(i) && !estaEm(i.arquivo, 'shared/http') && !estaEm(i.arquivo, 'main'),
  },
  infraSoNoCompositionRoot: {
    id: 'c',
    descricao: 'somente main/ importa **/infrastructure/** de fora do próprio módulo (composition root)',
    violadaPor: (i) =>
      alvoLocalEm(i, 'infrastructure') && !estaEm(i.arquivo, 'main') && unidadeDe(i.arquivo) !== unidadeDe(i.alvo),
  },
  featuresSemInfra: {
    id: 'c',
    descricao: 'features/** nunca importa infrastructure',
    violadaPor: (i) => temPasta(i.arquivo, 'features') && alvoLocalEm(i, 'infrastructure'),
  },
  fatiasIsoladas: {
    id: 'd',
    descricao: 'uma fatia (modules/<m>/features/<fatia>/**) não importa outra fatia',
    violadaPor: (i) => {
      const origem = fatiaDe(i.arquivo);
      const destino = i.externo ? undefined : fatiaDe(i.alvo);
      return origem !== undefined && destino !== undefined && origem !== destino;
    },
  },
  modulosIsolados: {
    id: 'e',
    descricao:
      'um módulo não importa domain, features ou infrastructure de outro módulo ' +
      '(exceto pedidos/infrastructure/*GatewayAdapter.ts -> import type de restaurantes|clientes/domain/*Repository.ts)',
    violadaPor: (i) => {
      const origem = moduloDe(i.arquivo);
      const destino = i.externo ? undefined : moduloDe(i.alvo);
      return (
        origem !== undefined &&
        destino !== undefined &&
        origem !== destino &&
        /^modules\/[^/]+\/(domain|features|infrastructure)\//.test(i.alvo) &&
        !ehExcecaoDocumentada(i)
      );
    },
  },
  modulosSemAcoplamentoDireto: {
    id: 'e (complemento)',
    descricao:
      'um módulo não importa NADA de outro módulo (application, *.module.ts...) além da exceção documentada; ' +
      'a integração entre módulos acontece no composition root',
    violadaPor: (i) => {
      const origem = moduloDe(i.arquivo);
      const destino = i.externo ? undefined : moduloDe(i.alvo);
      return origem !== undefined && destino !== undefined && origem !== destino && !ehExcecaoDocumentada(i);
    },
  },
  sharedIndependente: {
    id: 'f',
    descricao: 'shared/ não importa modules/ nem main/',
    violadaPor: (i) => estaEm(i.arquivo, 'shared') && !i.externo && (estaEm(i.alvo, 'modules') || estaEm(i.alvo, 'main')),
  },
  ninguemImportaMain: {
    id: 'g',
    descricao: 'nenhum arquivo de src/ (exceto main/) importa main/',
    violadaPor: (i) => !estaEm(i.arquivo, 'main') && !i.externo && estaEm(i.alvo, 'main'),
  },
} satisfies Record<string, Regra>;

/** Lista as violações de uma regra no formato `arquivo -> import`. */
export function verificar(importacoes: readonly Importacao[], regra: Regra): string[] {
  return importacoes.filter((i) => regra.violadaPor(i)).map((i) => `${i.arquivo} -> ${i.alvo}`);
}

// ---------- matcher com mensagem legível ----------

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      /** Passa quando a lista de violações (strings) está vazia; a mensagem lista cada violação. */
      toBeSemViolacoes(regra: string): R;
    }
  }
}

expect.extend({
  toBeSemViolacoes(violacoes: string[], regra: string) {
    const pass = violacoes.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? `Esperava violações da regra "${regra}", mas nenhuma foi encontrada.`
          : `Regra de arquitetura violada: ${regra}\n` +
            `${violacoes.length} violação(ões):\n` +
            violacoes.map((v) => `  - ${v}`).join('\n'),
    };
  },
});
