import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';
import type { PaymentMethod, PaymentType } from '../shared/constants.js';

export type PaymentAttributes = {
  id: string;
  orderId: string;
  type: PaymentType;
  amount: string;
  paymentMethod: PaymentMethod;
  paidAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  'id' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> {
  declare id: string;
  declare orderId: string;
  declare type: PaymentType;
  declare amount: string;
  declare paymentMethod: PaymentMethod;
  declare paidAt: Date;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initPaymentModel(sequelize: Sequelize): typeof Payment {
  Payment.init(
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
      type: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      paidAt: {
        type: DataTypes.DATE,
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
      tableName: 'payments',
    },
  );

  return Payment;
}
