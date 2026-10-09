import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import * as ts from 'typescript';

/**
 * Leitura estática do código-fonte: lista os arquivos .ts de src/ e extrai, via
 * AST do compilador TypeScript (já presente como devDependency), todos os
 * imports de cada arquivo:
 *   - import ... from 'x' / import 'x' / import type ... from 'x'
 *   - export ... from 'x' / export * from 'x'
 *   - require('x') / import x = require('x') / import('x')
 * Imports relativos são resolvidos para um caminho relativo a src/ (com ".ts").
 */

export const SRC = resolve(__dirname, '../../../src');

export interface Importacao {
  /** Arquivo que importa, relativo a src/, com "/" (ex.: modules/pedidos/domain/Pedido.ts). */
  arquivo: string;
  /** Alvo: caminho relativo a src/ (import relativo resolvido) ou nome do pacote (ex.: express). */
  alvo: string;
  /** true quando o alvo é um pacote (node_modules ou módulo nativo do Node). */
  externo: boolean;
  /** true para `import type` / `export type` (apagado na compilação). */
  somenteTipo: boolean;
}

export interface EspecificadorExtraido {
  especificador: string;
  somenteTipo: boolean;
}

export const normalizar = (caminho: string): string => caminho.split(sep).join('/');

export function listarArquivosTs(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return listarArquivosTs(caminho);
    return caminho.endsWith('.ts') ? [caminho] : [];
  });
}

/** Extrai os especificadores de módulo de um código-fonte TypeScript. */
export function extrairEspecificadores(codigo: string, nomeArquivo = 'arquivo.ts'): EspecificadorExtraido[] {
  const fonte = ts.createSourceFile(nomeArquivo, codigo, ts.ScriptTarget.Latest, true);
  const encontrados: EspecificadorExtraido[] = [];

  const visitar = (no: ts.Node): void => {
    if (ts.isImportDeclaration(no) && ts.isStringLiteral(no.moduleSpecifier)) {
      encontrados.push({
        especificador: no.moduleSpecifier.text,
        somenteTipo: no.importClause?.isTypeOnly ?? false,
      });
    } else if (ts.isExportDeclaration(no) && no.moduleSpecifier && ts.isStringLiteral(no.moduleSpecifier)) {
      encontrados.push({ especificador: no.moduleSpecifier.text, somenteTipo: no.isTypeOnly });
    } else if (
      ts.isImportEqualsDeclaration(no) &&
      ts.isExternalModuleReference(no.moduleReference) &&
      ts.isStringLiteral(no.moduleReference.expression)
    ) {
      encontrados.push({ especificador: no.moduleReference.expression.text, somenteTipo: no.isTypeOnly });
    } else if (ts.isCallExpression(no) && no.arguments.length >= 1 && ts.isStringLiteralLike(no.arguments[0])) {
      const ehRequire = ts.isIdentifier(no.expression) && no.expression.text === 'require';
      const ehImportDinamico = no.expression.kind === ts.SyntaxKind.ImportKeyword;
      if (ehRequire || ehImportDinamico) {
        encontrados.push({ especificador: no.arguments[0].text, somenteTipo: false });
      }
    }
    ts.forEachChild(no, visitar);
  };

  visitar(fonte);
  return encontrados;
}

/**
 * Resolve um import relativo para um arquivo existente (X.ts, X/index.ts, X.js→X.ts).
 * Retorna o caminho relativo a `raiz`; se não existir, retorna o caminho sem extensão.
 */
export function resolverRelativo(arquivoAbsoluto: string, especificador: string, raiz = SRC): string {
  const base = resolve(dirname(arquivoAbsoluto), especificador);
  const candidatos = [base, `${base}.ts`, join(base, 'index.ts'), base.replace(/\.js$/, '.ts')];
  const existente = candidatos.find((c) => c.endsWith('.ts') && existsSync(c) && statSync(c).isFile());
  return normalizar(relative(raiz, existente ?? base));
}

export function extrairImportacoes(arquivoAbsoluto: string, raiz = SRC): Importacao[] {
  const arquivo = normalizar(relative(raiz, arquivoAbsoluto));
  return extrairEspecificadores(readFileSync(arquivoAbsoluto, 'utf8'), arquivoAbsoluto).map(
    ({ especificador, somenteTipo }) => {
      const externo = !especificador.startsWith('.');
      return {
        arquivo,
        alvo: externo ? especificador : resolverRelativo(arquivoAbsoluto, especificador, raiz),
        externo,
        somenteTipo,
      };
    },
  );
}

export interface Grafo {
  /** Arquivos .ts de src/, relativos a src/. */
  arquivos: string[];
  importacoes: Importacao[];
}

export function carregarGrafo(raiz = SRC): Grafo {
  const absolutos = listarArquivosTs(raiz);
  return {
    arquivos: absolutos.map((a) => normalizar(relative(raiz, a))),
    importacoes: absolutos.flatMap((a) => extrairImportacoes(a, raiz)),
  };
}

/** Nomes das classes exportadas por um arquivo que declaram um método `execute`. */
export function classesExportadasComExecute(codigo: string, nomeArquivo = 'arquivo.ts'): string[] {
  const fonte = ts.createSourceFile(nomeArquivo, codigo, ts.ScriptTarget.Latest, true);
  return fonte.statements
    .filter(ts.isClassDeclaration)
    .filter((classe) => classe.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
    .filter((classe) =>
      classe.members.some(
        (membro) =>
          ts.isMethodDeclaration(membro) &&
          membro.name !== undefined &&
          ts.isIdentifier(membro.name) &&
          membro.name.text === 'execute',
      ),
    )
    .map((classe) => classe.name?.text ?? '(anônima)');
}
