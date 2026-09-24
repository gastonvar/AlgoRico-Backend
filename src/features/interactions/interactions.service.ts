import { AppError } from '../../errors/app-error.js';
import { pinoLogger } from '../../lib/pino.js';
import { storage } from '../../lib/storage.js';
import { Attachment, Interaction, Order } from '../../models/index.js';
import { sequelize } from '../../database/sequelize.js';
import { paginationMeta, paginationOffset, type PaginationQuery } from '../../shared/pagination.js';
import { getClientById } from '../clients/clients.service.js';
import { toPublicInteraction, type PublicInteraction } from './interactions.mappers.js';
import type { CreateInteractionBody, UpdateInteractionBody } from './interactions.schemas.js';

async function getOrderById(orderId: string, companyId: string): Promise<Order> {
  const order = await Order.findOne({ where: { id: orderId, companyId } });
  if (!order) {
    throw AppError.notFound('Order not found');
  }
  return order;
}

async function listInteractions(
  where: { clientId: string } | { orderId: string },
  companyId: string,
  query: PaginationQuery,
): Promise<{ data: PublicInteraction[]; meta: ReturnType<typeof paginationMeta> }> {
  const { limit, offset } = paginationOffset(query);

  const { rows, count } = await Interaction.findAndCountAll({
    where: { ...where, companyId },
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
  companyId: string,
  query: PaginationQuery,
): Promise<{ data: PublicInteraction[]; meta: ReturnType<typeof paginationMeta> }> {
  await getClientById(clientId, companyId, { includeArchived: true });
  return listInteractions({ clientId }, companyId, query);
}

export async function listOrderInteractions(
  orderId: string,
  companyId: string,
  query: PaginationQuery,
): Promise<{ data: PublicInteraction[]; meta: ReturnType<typeof paginationMeta> }> {
  await getOrderById(orderId, companyId);
  return listInteractions({ orderId }, companyId, query);
}

export async function createInteraction(
  clientId: string,
  userId: string,
  companyId: string,
  input: CreateInteractionBody,
  orderId?: string | null,
): Promise<PublicInteraction> {
  await getClientById(clientId, companyId);
  const interaction = await Interaction.create({
    companyId,
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
  companyId: string,
  input: CreateInteractionBody,
): Promise<PublicInteraction> {
  const order = await getOrderById(orderId, companyId);
  return createInteraction(order.clientId, userId, companyId, input, order.id);
}

export async function getInteractionById(interactionId: string, companyId: string): Promise<Interaction> {
  const interaction = await Interaction.findOne({
    where: { id: interactionId, companyId },
    include: [{ model: Attachment, as: 'attachments' }],
  });
  if (!interaction) {
    throw AppError.notFound('Interaction not found');
  }
  return interaction;
}

export async function getInteraction(interactionId: string, companyId: string): Promise<PublicInteraction> {
  const interaction = await getInteractionById(interactionId, companyId);
  return toPublicInteraction(interaction);
}

export async function updateInteraction(
  interactionId: string,
  companyId: string,
  input: UpdateInteractionBody,
): Promise<PublicInteraction> {
  const interaction = await getInteractionById(interactionId, companyId);
  if (input.channel !== undefined) interaction.channel = input.channel;
  if (input.content !== undefined) interaction.content = input.content;
  if (input.occurredAt !== undefined) interaction.occurredAt = new Date(input.occurredAt);
  await interaction.save();
  return toPublicInteraction(interaction);
}

export async function deleteInteraction(interactionId: string, companyId: string): Promise<void> {
  const interaction = await getInteractionById(interactionId, companyId);
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
