import { classesExportadasComExecute, extrairEspecificadores, Importacao } from './support/grafo';
import { Regra, REGRAS, verificar } from './support/regras';

/**
 * Testes-sentinela: provam que o verificador funciona. Se o extrator de imports
 * ou alguma regra regredir (ex.: passar a aceitar tudo), estes testes falham —
 * evitando que os testes de arquitetura passem "de graça".
 */

const local = (arquivo: string, alvo: string, somenteTipo = false): Importacao => ({
  arquivo,
  alvo,
  externo: false,
  somenteTipo,
});
const pacote = (arquivo: string, alvo: string): Importacao => ({ arquivo, alvo, externo: true, somenteTipo: false });

describe('Sentinela: extração de imports', () => {
  it('reconhece import, import type, export from, require, import = require e import()', () => {
    const codigo = `
      import express, { Router } from 'express';
      import type { A } from './a';
      import {
        B,
        C,
      } from '../b';
      import './efeito-colateral';
      export { D } from './d';
      export * from './e';
      export type { F } from './f';
      import G = require('./g');
      const h = require('./h');
      async function carregar() { return import('./i'); }
      // import { Comentado } from './nao-conta';
      const texto = "import { X } from './nao-conta-string'";
    `;

    expect(extrairEspecificadores(codigo)).toEqual([
      { especificador: 'express', somenteTipo: false },
      { especificador: './a', somenteTipo: true },
      { especificador: '../b', somenteTipo: false },
      { especificador: './efeito-colateral', somenteTipo: false },
      { especificador: './d', somenteTipo: false },
      { especificador: './e', somenteTipo: false },
      { especificador: './f', somenteTipo: true },
      { especificador: './g', somenteTipo: false },
      { especificador: './h', somenteTipo: false },
      { especificador: './i', somenteTipo: false },
    ]);
  });

  it('detecta a classe exportada com execute (e ignora quem não tem)', () => {
    expect(
      classesExportadasComExecute('export class FazerAlgoUseCase { async execute(): Promise<void> {} }'),
    ).toEqual(['FazerAlgoUseCase']);
    expect(classesExportadasComExecute('export class SemExecute { rodar() {} }')).toEqual([]);
    expect(classesExportadasComExecute('class NaoExportada { execute() {} }')).toEqual([]);
  });
});

describe('Sentinela: o verificador detecta violações em imports fictícios', () => {
  const casos: Array<{ regra: Regra; violacao: Importacao; permitido: Importacao }> = [
    {
      regra: REGRAS.dominio,
      violacao: pacote('modules/pedidos/domain/Pedido.ts', 'express'),
      permitido: local('modules/pedidos/domain/Pedido.ts', 'shared/domain/Entity.ts'),
    },
    {
      regra: REGRAS.dominio,
      violacao: local('shared/domain/Money.ts', 'shared/application/UseCase.ts'),
      permitido: local('shared/domain/Money.ts', 'shared/domain/errors.ts'),
    },
    {
      regra: REGRAS.casoDeUso,
      violacao: local(
        'modules/pedidos/features/criar-pedido/CriarPedidoUseCase.ts',
        'modules/pedidos/infrastructure/InMemoryPedidoRepository.ts',
      ),
      permitido: local(
        'modules/pedidos/features/criar-pedido/CriarPedidoUseCase.ts',
        'modules/pedidos/domain/PedidoRepository.ts',
      ),
    },
    {
      regra: REGRAS.expressSoNaBorda,
      violacao: pacote('modules/pedidos/features/criar-pedido/CriarPedidoController.ts', 'express'),
      permitido: pacote('shared/http/expressAdapter.ts', 'express'),
    },
    {
      regra: REGRAS.infraSoNoCompositionRoot,
      violacao: local('modules/pedidos/pedidos.module.ts', 'shared/infrastructure/InMemoryEventBus.ts'),
      permitido: local('main/container.ts', 'shared/infrastructure/InMemoryEventBus.ts'),
    },
    {
      regra: REGRAS.featuresSemInfra,
      violacao: local(
        'modules/pedidos/features/obter-pedido/ObterPedidoController.ts',
        'modules/pedidos/infrastructure/InMemoryPedidoRepository.ts',
      ),
      permitido: local(
        'modules/pedidos/infrastructure/CatalogoGatewayAdapter.ts',
        'modules/pedidos/application/ports/CatalogoGateway.ts',
      ),
    },
    {
      regra: REGRAS.fatiasIsoladas,
      violacao: local(
        'modules/pedidos/features/cancelar-pedido/CancelarPedidoUseCase.ts',
        'modules/pedidos/features/criar-pedido/criar-pedido.dto.ts',
      ),
      permitido: local(
        'modules/pedidos/features/criar-pedido/CriarPedidoUseCase.ts',
        'modules/pedidos/features/criar-pedido/criar-pedido.dto.ts',
      ),
    },
    {
      regra: REGRAS.modulosIsolados,
      violacao: local('modules/pedidos/domain/Pedido.ts', 'modules/restaurantes/domain/Produto.ts'),
      permitido: local(
        'modules/pedidos/infrastructure/CatalogoGatewayAdapter.ts',
        'modules/restaurantes/domain/RestauranteRepository.ts',
        true,
      ),
    },
    {
      // a exceção exige `import type`: um import de valor do mesmo arquivo é violação
      regra: REGRAS.modulosIsolados,
      violacao: local(
        'modules/pedidos/infrastructure/ClienteGatewayAdapter.ts',
        'modules/clientes/domain/ClienteRepository.ts',
        false,
      ),
      permitido: local(
        'modules/pedidos/infrastructure/ClienteGatewayAdapter.ts',
        'modules/clientes/domain/ClienteRepository.ts',
        true,
      ),
    },
    {
      regra: REGRAS.modulosSemAcoplamentoDireto,
      violacao: local('modules/pedidos/pedidos.module.ts', 'modules/clientes/clientes.module.ts'),
      permitido: local('main/container.ts', 'modules/clientes/clientes.module.ts'),
    },
    {
      regra: REGRAS.sharedIndependente,
      violacao: local('shared/http/errorHandler.ts', 'modules/pedidos/domain/Pedido.ts'),
      permitido: local('shared/http/errorHandler.ts', 'shared/domain/errors.ts'),
    },
    {
      regra: REGRAS.ninguemImportaMain,
      violacao: local('modules/clientes/clientes.module.ts', 'main/container.ts'),
      permitido: local('main/app.ts', 'main/container.ts'),
    },
  ];

  it.each(casos)('($regra.id) detecta $violacao.arquivo -> $violacao.alvo', ({ regra, violacao, permitido }) => {
    const ficticio = [permitido, violacao];

    expect(verificar(ficticio, regra)).toEqual([`${violacao.arquivo} -> ${violacao.alvo}`]);
    expect(verificar([permitido], regra)).toEqual([]);
  });

  it('a mensagem de falha lista cada violação no formato "arquivo -> import"', () => {
    const ficticio = [
      pacote('modules/pedidos/domain/Pedido.ts', 'express'),
      local('modules/pedidos/domain/Pedido.ts', 'modules/pedidos/infrastructure/InMemoryPedidoRepository.ts'),
    ];

    expect(() => expect(verificar(ficticio, REGRAS.dominio)).toBeSemViolacoes(REGRAS.dominio.descricao)).toThrow(
      /2 violação\(ões\):\n {2}- modules\/pedidos\/domain\/Pedido\.ts -> express\n {2}- modules\/pedidos\/domain\/Pedido\.ts -> modules\/pedidos\/infrastructure\/InMemoryPedidoRepository\.ts/,
    );
  });
});
