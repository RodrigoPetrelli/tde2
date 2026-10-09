import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';

/**
 * Verifica estaticamente as regras de dependência da arquitetura
 * (Clean Architecture + Vertical Slice + isolamento entre módulos).
 */

const SRC = resolve(__dirname, '../../src');

interface Importacao {
  arquivo: string; // relativo a src, com "/"
  alvo: string; // relativo a src (imports relativos) ou nome do pacote
  somenteTipo: boolean;
}

function listarArquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? listarArquivos(caminho) : caminho.endsWith('.ts') ? [caminho] : [];
  });
}

const normalizar = (caminho: string): string => caminho.split(sep).join('/');

const arquivos = listarArquivos(SRC);
const importacoes: Importacao[] = arquivos.flatMap((absoluto) => {
  const arquivo = normalizar(relative(SRC, absoluto));
  const codigo = readFileSync(absoluto, 'utf8');
  return [...codigo.matchAll(/import\s+(type\s+)?[^'"]*?from\s+'([^']+)'/g)].map(([, tipo, especificador]) => ({
    arquivo,
    alvo: especificador.startsWith('.')
      ? normalizar(relative(SRC, resolve(dirname(absoluto), especificador)))
      : especificador,
    somenteTipo: tipo !== undefined,
  }));
});

const violacoes = (filtro: (i: Importacao) => boolean): string[] =>
  importacoes.filter(filtro).map((i) => `${i.arquivo} -> ${i.alvo}`);

const moduloDe = (caminho: string): string | undefined => /^modules\/([^/]+)\//.exec(caminho)?.[1];
const fatiaDe = (caminho: string): string | undefined => /^modules\/[^/]+\/features\/([^/]+)\//.exec(caminho)?.[1];

describe('Regras de arquitetura', () => {
  it('encontra os arquivos do projeto', () => {
    expect(arquivos.length).toBeGreaterThan(40);
  });

  it('domain não depende de application, infrastructure, http, features, main nem express', () => {
    expect(
      violacoes(
        (i) =>
          /(^|\/)domain\//.test(i.arquivo) &&
          (i.alvo === 'express' || /(^|\/)(application|infrastructure|http|features|main)(\/|$)/.test(i.alvo)),
      ),
    ).toEqual([]);
  });

  it('casos de uso não dependem de express, http nem infrastructure', () => {
    expect(
      violacoes(
        (i) =>
          i.arquivo.endsWith('UseCase.ts') &&
          (i.alvo === 'express' || /(^|\/)(infrastructure|http|main)(\/|$)/.test(i.alvo)),
      ),
    ).toEqual([]);
  });

  it('express só é conhecido por shared/http, controllers, rotas e main', () => {
    expect(
      violacoes(
        (i) =>
          i.alvo === 'express' &&
          !/^(shared\/http\/|main\/)/.test(i.arquivo) &&
          !/(Controller\.ts|\.route\.ts)$/.test(i.arquivo),
      ),
    ).toEqual([]);
  });

  it('somente main/ importa implementações de infraestrutura de outra camada', () => {
    expect(
      violacoes(
        (i) =>
          /(^|\/)infrastructure\//.test(i.alvo) &&
          !i.arquivo.startsWith('main/') &&
          !/(^|\/)infrastructure\//.test(i.arquivo),
      ),
    ).toEqual([]);
  });

  it('uma fatia não importa outra fatia', () => {
    expect(
      violacoes((i) => {
        const origem = fatiaDe(i.arquivo);
        const destino = fatiaDe(i.alvo);
        return origem !== undefined && destino !== undefined && origem !== destino;
      }),
    ).toEqual([]);
  });

  it('módulos são isolados (exceto adaptadores de pedidos importando o tipo do repositório)', () => {
    const excecaoPermitida = (i: Importacao): boolean =>
      i.somenteTipo &&
      /^modules\/pedidos\/infrastructure\/\w+GatewayAdapter\.ts$/.test(i.arquivo) &&
      /^modules\/(restaurantes|clientes)\/domain\/\w+Repository$/.test(i.alvo);

    expect(
      violacoes((i) => {
        const origem = moduloDe(i.arquivo);
        const destino = moduloDe(i.alvo);
        return origem !== undefined && destino !== undefined && origem !== destino && !excecaoPermitida(i);
      }),
    ).toEqual([]);
  });

  it('shared não depende de modules nem de main', () => {
    expect(violacoes((i) => i.arquivo.startsWith('shared/') && /^(modules|main)\//.test(i.alvo))).toEqual([]);
  });

  it('não usa any', () => {
    const comAny = arquivos.filter((a) => /(:\s*any\b|\bas\s+any\b|<any>|any\[\])/.test(readFileSync(a, 'utf8')));
    expect(comAny.map((a) => normalizar(relative(SRC, a)))).toEqual([]);
  });
});
