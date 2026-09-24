import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export type AttachmentAttributes = {
  id: string;
  companyId: string;
  interactionId: string | null;
  paymentId: string | null;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AttachmentCreationAttributes = Optional<
  AttachmentAttributes,
  'id' | 'interactionId' | 'paymentId' | 'createdAt' | 'updatedAt'
>;

export class Attachment extends Model<AttachmentAttributes, AttachmentCreationAttributes> {
  declare id: string;
  declare companyId: string;
  declare interactionId: string | null;
  declare paymentId: string | null;
  declare originalFilename: string;
  declare mimeType: string;
  declare fileSize: number;
  declare storageKey: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initAttachmentModel(sequelize: Sequelize): typeof Attachment {
  Attachment.init(
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
      interactionId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      paymentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      originalFilename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      storageKey: {
        type: DataTypes.STRING(512),
        allowNull: false,
        unique: true,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'attachments',
    },
  );

  return Attachment;
}
