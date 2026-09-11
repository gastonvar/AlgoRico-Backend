import { AppError } from '../../errors/app-error.js';
import { pinoLogger } from '../../lib/pino.js';
import { storage } from '../../lib/storage.js';
import { Attachment, Interaction, Order } from '../../models/index.js';
import { sequelize } from '../../database/sequelize.js';
import { paginationMeta, paginationOffset, type PaginationQuery } from '../../shared/pagination.js';
import { getClientById } from '../clients/clients.service.js';
import { toPublicInteraction, type PublicInteraction } from './interactions.mappers.js';
import type { CreateInteractionBody, UpdateInteractionBody } from './interactions.schemas.js';

async function getOrderById(orderId: string): Promise<Order> {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw AppError.notFound('Order not found');
  }
  return order;
}

async function listInteractions(
  where: { clientId: string } | { orderId: string },
  query: PaginationQuery,
): Promise<{ data: PublicInteraction[]; meta: ReturnType<typeof paginationMeta> }> {
  const { limit, offset } = paginationOffset(query);

  const { rows, count } = await Interaction.findAndCountAll({
    where,
    include: [{ model: Attachment, as: 'attachments' }],
    order: [
      ['occurredAt', 'DESC'],
      [{ model: Attachment, as: 'attachments' }, 'createdAt', 'ASC'],
    ],
    limit,
    offset,
    distinct: true,
  });

  return {
    data: rows.map(toPublicInteraction),
    meta: paginationMeta(query, count),
  };
}

export async function listClientInteractions(
  clientId: string,
  query: PaginationQuery,
): Promise<{ data: PublicInteraction[]; meta: ReturnType<typeof paginationMeta> }> {
  await getClientById(clientId, { includeArchived: true });
  return listInteractions({ clientId }, query);
}

export async function listOrderInteractions(
  orderId: string,
  query: PaginationQuery,
): Promise<{ data: PublicInteraction[]; meta: ReturnType<typeof paginationMeta> }> {
  await getOrderById(orderId);
  return listInteractions({ orderId }, query);
}

export async function createInteraction(
  clientId: string,
  userId: string,
  input: CreateInteractionBody,
  orderId?: string | null,
): Promise<PublicInteraction> {
  await getClientById(clientId);
  const interaction = await Interaction.create({
    clientId,
    orderId: orderId ?? null,
    userId,
    channel: input.channel,
    content: input.content,
    occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
  });

  return toPublicInteraction(interaction);
}

export async function createOrderInteraction(
  orderId: string,
  userId: string,
  input: CreateInteractionBody,
): Promise<PublicInteraction> {
  const order = await getOrderById(orderId);
  return createInteraction(order.clientId, userId, input, order.id);
}

export async function getInteractionById(interactionId: string): Promise<Interaction> {
  const interaction = await Interaction.findByPk(interactionId, {
    include: [{ model: Attachment, as: 'attachments' }],
  });
  if (!interaction) {
    throw AppError.notFound('Interaction not found');
  }
  return interaction;
}

export async function getInteraction(interactionId: string): Promise<PublicInteraction> {
  const interaction = await getInteractionById(interactionId);
  return toPublicInteraction(interaction);
}

export async function updateInteraction(
  interactionId: string,
  input: UpdateInteractionBody,
): Promise<PublicInteraction> {
  const interaction = await getInteractionById(interactionId);
  if (input.channel !== undefined) interaction.channel = input.channel;
  if (input.content !== undefined) interaction.content = input.content;
  if (input.occurredAt !== undefined) interaction.occurredAt = new Date(input.occurredAt);
  await interaction.save();
  return toPublicInteraction(interaction);
}

export async function deleteInteraction(interactionId: string): Promise<void> {
  const interaction = await getInteractionById(interactionId);
  const attachments = (interaction.get('attachments') as Attachment[] | undefined) ?? [];
  const storageKeys = attachments.map((attachment) => attachment.storageKey);

  await sequelize.transaction(async (transaction) => {
    await Attachment.destroy({ where: { interactionId }, transaction });
    await interaction.destroy({ transaction });
  });

  for (const storageKey of storageKeys) {
    try {
      await storage.delete(storageKey);
    } catch (error) {
      pinoLogger.error(
        { err: error, storageKey, interactionId },
        'Failed to delete MinIO object after interaction deletion',
      );
    }
  }
}
