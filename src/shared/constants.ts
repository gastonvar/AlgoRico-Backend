export const INTERACTION_CHANNELS = [
  'WHATSAPP',
  'INSTAGRAM',
  'PHONE',
  'IN_PERSON',
  'OTHER',
] as const;

export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];

export const ORDER_STATUSES = [
  'LEAD',
  'QUOTED',
  'AWAITING_DEPOSIT',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY',
  'DELIVERED',
  'PICKED_UP',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FULFILLMENT_TYPES = ['PICKUP', 'DELIVERY'] as const;
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];

export const PAYMENT_TYPES = ['DEPOSIT', 'FINAL', 'OTHER'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const INGREDIENT_UNITS = ['g', 'kg', 'ml', 'l', 'un'] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MIME_EXTENSIONS: Record<AllowedImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const SESSION_COOKIE_NAME = 'algorico.sid';
export const CSRF_COOKIE_NAME = 'algorico.csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export const PRE_CONFIRMATION_STATUSES: readonly OrderStatus[] = [
  'LEAD',
  'QUOTED',
  'AWAITING_DEPOSIT',
];

export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = ORDER_STATUSES.filter(
  (status) => status !== 'COMPLETED' && status !== 'CANCELLED',
);
