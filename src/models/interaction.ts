import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';
import type { InteractionChannel } from '../shared/constants.js';

export type InteractionAttributes = {
  id: string;
  companyId: string;
  clientId: string;
  orderId: string | null;
  userId: string;
  channel: InteractionChannel;
  content: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type InteractionCreationAttributes = Optional<
  InteractionAttributes,
  'id' | 'orderId' | 'createdAt' | 'updatedAt'
>;

export class Interaction extends Model<InteractionAttributes, InteractionCreationAttributes> {
  declare id: string;
  declare companyId: string;
  declare clientId: string;
  declare orderId: string | null;
  declare userId: string;
  declare channel: InteractionChannel;
  declare content: string;
  declare occurredAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initInteractionModel(sequelize: Sequelize): typeof Interaction {
  Interaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      channel: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      occurredAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'interactions',
    },
  );

  return Interaction;
}
