import type { Client } from '../../models/client.js';

export type PublicClient = {
  id: string;
  name: string;
  phone: string | null;
  instagramUsername: string | null;
  email: string | null;
  notes: string | null;
  needsFollowUp: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientDetail = PublicClient & {
  interactionCount: number;
  orderCount: number;
  openTaskCount: number;
};

export function toPublicClient(client: Client): PublicClient {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    instagramUsername: client.instagramUsername,
    email: client.email,
    notes: client.notes,
    needsFollowUp: client.needsFollowUp,
    archivedAt: client.archivedAt ? client.archivedAt.toISOString() : null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
