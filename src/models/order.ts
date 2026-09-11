import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';
import type { FulfillmentType, OrderStatus } from '../shared/constants.js';

export type OrderAttributes = {
  id: string;
  clientId: string;
  status: OrderStatus;
  eventDate: string | null;
  eventTime: string | null;
  description: string | null;
  fulfillmentType: FulfillmentType;
  deliveryAddress: string | null;
  deliveryTime: string | null;
  totalAmount: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderCreationAttributes = Optional<
  OrderAttributes,
  | 'id'
  | 'status'
  | 'eventDate'
  | 'eventTime'
  | 'description'
  | 'deliveryAddress'
  | 'deliveryTime'
  | 'totalAmount'
  | 'notes'
  | 'createdAt'
  | 'updatedAt'
>;

export class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  declare id: string;
  declare clientId: string;
  declare status: OrderStatus;
  declare eventDate: string | null;
  declare eventTime: string | null;
  declare description: string | null;
  declare fulfillmentType: FulfillmentType;
  declare deliveryAddress: string | null;
  declare deliveryTime: string | null;
  declare totalAmount: string;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initOrderModel(sequelize: Sequelize): typeof Order {
  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'LEAD',
      },
      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      eventTime: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fulfillmentType: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'PICKUP',
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deliveryTime: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: '0.00',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'orders',
    },
  );

  return Order;
}
