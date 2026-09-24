import { lineTotal, roundMoney } from '../../shared/money.js';
import type { Attachment } from '../../models/attachment.js';
import type { Client } from '../../models/client.js';
import type { Order } from '../../models/order.js';
import type { OrderItem } from '../../models/order-item.js';
import type { Payment } from '../../models/payment.js';
import type { Recipe } from '../../models/recipe.js';
import type { PaymentSummary } from '../../shared/payments.js';
import { toPublicAttachment, type PublicAttachment } from '../attachments/attachments.mappers.js';
import { toPublicClient, type PublicClient } from '../clients/clients.mappers.js';

export type PublicOrderRecipe = {
  id: string;
  name: string;
};

export type PublicOrderItem = {
  id: string;
  orderId: string;
  recipeId: string | null;
  recipe: PublicOrderRecipe | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicPayment = {
  id: string;
  orderId: string;
  type: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
  hasPaymentReceipt: boolean;
  attachments: PublicAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type PublicOrder = {
  id: string;
  clientId: string;
  client: PublicClient | null;
  status: string;
  eventDate: string | null;
  eventTime: string | null;
  description: string | null;
  fulfillmentType: string;
  deliveryDate: string | null;
  deliveryAddress: string | null;
  deliveryTime: string | null;
  notes: string | null;
  items: PublicOrderItem[];
  payments: PublicPayment[];
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

export function toPublicOrderItem(item: OrderItem): PublicOrderItem {
  const unitPrice = roundMoney(item.unitPrice);
  const recipe = (item.get('recipe') as Recipe | undefined) ?? null;
  return {
    id: item.id,
    orderId: item.orderId,
    recipeId: item.recipeId,
    recipe: recipe ? { id: recipe.id, name: recipe.name } : null,
    description: item.description,
    quantity: item.quantity,
    unitPrice,
    lineTotal: lineTotal(item.quantity, item.unitPrice),
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toPublicPayment(payment: Payment): PublicPayment {
  const attachments = (payment.get('attachments') as Attachment[] | undefined) ?? [];
  return {
    id: payment.id,
    orderId: payment.orderId,
    type: payment.type,
    amount: roundMoney(payment.amount),
    paymentMethod: payment.paymentMethod,
    paidAt: payment.paidAt.toISOString(),
    notes: payment.notes,
    hasPaymentReceipt: payment.hasPaymentReceipt,
    attachments: attachments.map(toPublicAttachment),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

export function toPublicOrder(
  order: Order,
  summary: PaymentSummary,
  options?: { includeItems?: boolean; includePayments?: boolean },
): PublicOrder {
  const client = (order.get('client') as Client | undefined) ?? null;
  const items = (order.get('items') as OrderItem[] | undefined) ?? [];
  const payments = (order.get('payments') as Payment[] | undefined) ?? [];

  return {
    id: order.id,
    clientId: order.clientId,
    client: client ? toPublicClient(client) : null,
    status: order.status,
    eventDate: order.eventDate,
    eventTime: order.eventTime,
    description: order.description,
    fulfillmentType: order.fulfillmentType,
    deliveryDate: order.deliveryDate,
    deliveryAddress: order.deliveryAddress,
    deliveryTime: order.deliveryTime,
    notes: order.notes,
    items: options?.includeItems === false ? [] : items.map(toPublicOrderItem),
    payments: options?.includePayments === false ? [] : payments.map(toPublicPayment),
    totalAmount: summary.totalAmount,
    paidAmount: summary.paidAmount,
    remainingBalance: summary.remainingBalance,
    paymentStatus: summary.paymentStatus,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
