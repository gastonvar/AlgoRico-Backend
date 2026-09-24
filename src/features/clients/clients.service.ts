import { Op, type WhereOptions } from 'sequelize';
import { AppError } from '../../errors/app-error.js';
import { Client, Interaction, Order, Task } from '../../models/index.js';
import { paginationMeta, paginationOffset } from '../../shared/pagination.js';
import { toPublicClient, type ClientDetail, type PublicClient } from './clients.mappers.js';
import type { CreateClientBody, ListClientsQuery, UpdateClientBody } from './clients.schemas.js';

function clientSearchWhere(companyId: string, query: ListClientsQuery): WhereOptions {
  const where: WhereOptions = { companyId };

  if (!query.includeArchived) {
    where.archivedAt = null;
  }

  if (query.needsFollowUp !== undefined) {
    where.needsFollowUp = query.needsFollowUp;
  }

  if (query.q) {
    const term = `%${query.q}%`;
    Object.assign(where, {
      [Op.or]: [
        { name: { [Op.iLike]: term } },
        { phone: { [Op.iLike]: term } },
        { instagramUsername: { [Op.iLike]: term } },
      ],
    });
  }

  return where;
}

export async function listClients(
  companyId: string,
  query: ListClientsQuery,
): Promise<{
  data: PublicClient[];
  meta: ReturnType<typeof paginationMeta>;
}> {
  const { limit, offset } = paginationOffset(query);
  const { rows, count } = await Client.findAndCountAll({
    where: clientSearchWhere(companyId, query),
    order: [['name', 'ASC']],
    limit,
    offset,
  });

  return {
    data: rows.map(toPublicClient),
    meta: paginationMeta(query, count),
  };
}

export async function createClient(companyId: string, input: CreateClientBody): Promise<PublicClient> {
  const client = await Client.create({
    companyId,
    name: input.name,
    phone: input.phone ?? null,
    instagramUsername: input.instagramUsername ?? null,
    email: input.email?.toLowerCase() ?? null,
    notes: input.notes ?? null,
    needsFollowUp: input.needsFollowUp ?? false,
  });

  return toPublicClient(client);
}

export async function getClientById(
  clientId: string,
  companyId: string,
  options?: { includeArchived?: boolean },
): Promise<Client> {
  const client = await Client.findOne({ where: { id: clientId, companyId } });
  if (!client || (!options?.includeArchived && client.archivedAt)) {
    throw AppError.notFound('Client not found');
  }
  return client;
}

export async function getClientDetail(clientId: string, companyId: string): Promise<ClientDetail> {
  const client = await getClientById(clientId, companyId, { includeArchived: true });

  const [interactionCount, orderCount, openTaskCount] = await Promise.all([
    Interaction.count({ where: { clientId } }),
    Order.count({ where: { clientId } }),
    Task.count({ where: { clientId, completed: false } }),
  ]);

  return {
    ...toPublicClient(client),
    interactionCount,
    orderCount,
    openTaskCount,
  };
}

export async function updateClient(
  clientId: string,
  companyId: string,
  input: UpdateClientBody,
): Promise<PublicClient> {
  const client = await getClientById(clientId, companyId, { includeArchived: true });

  if (input.name !== undefined) client.name = input.name;
  if (input.phone !== undefined) client.phone = input.phone;
  if (input.instagramUsername !== undefined) client.instagramUsername = input.instagramUsername;
  if (input.email !== undefined) client.email = input.email ? input.email.toLowerCase() : null;
  if (input.notes !== undefined) client.notes = input.notes;
  if (input.needsFollowUp !== undefined) client.needsFollowUp = input.needsFollowUp;
  if (input.archived !== undefined) {
    client.archivedAt = input.archived ? client.archivedAt ?? new Date() : null;
  }

  await client.save();
  return toPublicClient(client);
}
