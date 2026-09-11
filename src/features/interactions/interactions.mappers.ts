import type { Attachment } from '../../models/attachment.js';
import type { Interaction } from '../../models/interaction.js';
import { toPublicAttachment, type PublicAttachment } from '../attachments/attachments.mappers.js';

export type { PublicAttachment };

export type PublicInteraction = {
  id: string;
  clientId: string;
  orderId: string | null;
  userId: string;
  channel: string;
  content: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  attachments: PublicAttachment[];
};

export { toPublicAttachment };

export function toPublicInteraction(interaction: Interaction): PublicInteraction {
  const attachments = (interaction.get('attachments') as Attachment[] | undefined) ?? [];
  return {
    id: interaction.id,
    clientId: interaction.clientId,
    orderId: interaction.orderId,
    userId: interaction.userId,
    channel: interaction.channel,
    content: interaction.content,
    occurredAt: interaction.occurredAt.toISOString(),
    createdAt: interaction.createdAt.toISOString(),
    updatedAt: interaction.updatedAt.toISOString(),
    attachments: attachments.map(toPublicAttachment),
  };
}
