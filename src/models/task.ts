import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';
import type { TaskPriority } from '../shared/constants.js';

export type TaskAttributes = {
  id: string;
  companyId: string;
  clientId: string | null;
  orderId: string | null;
  title: string;
  description: string | null;
  dueAt: Date | null;
  priority: TaskPriority;
  completed: boolean;
  completedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskCreationAttributes = Optional<
  TaskAttributes,
  | 'id'
  | 'clientId'
  | 'orderId'
  | 'description'
  | 'dueAt'
  | 'priority'
  | 'completed'
  | 'completedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export class Task extends Model<TaskAttributes, TaskCreationAttributes> {
  declare id: string;
  declare companyId: string;
  declare clientId: string | null;
  declare orderId: string | null;
  declare title: string;
  declare description: string | null;
  declare dueAt: Date | null;
  declare priority: TaskPriority;
  declare completed: boolean;
  declare completedAt: Date | null;
  declare createdBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initTaskModel(sequelize: Sequelize): typeof Task {
  Task.init(
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
        allowNull: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      dueAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      priority: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'tasks',
    },
  );

  return Task;
}
