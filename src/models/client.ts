import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export type ClientAttributes = {
  id: string;
  name: string;
  phone: string | null;
  instagramUsername: string | null;
  email: string | null;
  notes: string | null;
  needsFollowUp: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientCreationAttributes = Optional<
  ClientAttributes,
  | 'id'
  | 'phone'
  | 'instagramUsername'
  | 'email'
  | 'notes'
  | 'needsFollowUp'
  | 'archivedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export class Client extends Model<ClientAttributes, ClientCreationAttributes> {
  declare id: string;
  declare name: string;
  declare phone: string | null;
  declare instagramUsername: string | null;
  declare email: string | null;
  declare notes: string | null;
  declare needsFollowUp: boolean;
  declare archivedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initClientModel(sequelize: Sequelize): typeof Client {
  Client.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      instagramUsername: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      needsFollowUp: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'clients',
    },
  );

  return Client;
}
