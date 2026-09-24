import type { Optional } from 'sequelize';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export type CompanyAttributes = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  logoMarkUrl: string | null;
  logoWordmarkUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CompanyCreationAttributes = Optional<
  CompanyAttributes,
  'id' | 'subtitle' | 'logoMarkUrl' | 'logoWordmarkUrl' | 'createdAt' | 'updatedAt'
>;

export class Company extends Model<CompanyAttributes, CompanyCreationAttributes> {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare subtitle: string | null;
  declare logoMarkUrl: string | null;
  declare logoWordmarkUrl: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initCompanyModel(sequelize: Sequelize): typeof Company {
  Company.init(
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
      slug: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      subtitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      logoMarkUrl: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      logoWordmarkUrl: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'companies',
    },
  );

  return Company;
}
