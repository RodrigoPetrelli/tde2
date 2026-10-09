export const StatusPedido = {
  CRIADO: 'CRIADO',
  CONFIRMADO: 'CONFIRMADO',
  CANCELADO: 'CANCELADO',
} as const;

export type StatusPedido = (typeof StatusPedido)[keyof typeof StatusPedido];
