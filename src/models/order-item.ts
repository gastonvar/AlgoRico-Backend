import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export type OrderItemAttributes = {
  id: string;
  orderId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItemCreationAttributes = Optional<
  OrderItemAttributes,
  'id' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> {
  declare id: string;
  declare orderId: string;
  declare description: string;
  declare quantity: number;
  declare unitPrice: string;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initOrderItemModel(sequelize: Sequelize): typeof OrderItem {
  OrderItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
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
      tableName: 'order_items',
    },
  );

  return OrderItem;
}
