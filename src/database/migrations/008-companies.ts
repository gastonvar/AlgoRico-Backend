import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';
import {
  ALGORICO_COMPANY_ID,
  ALGORICO_COMPANY_SLUG,
  AROME_COMPANY_ID,
  AROME_COMPANY_SLUG,
} from '../../shared/companies.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.createTable('companies', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    subtitle: { type: DataTypes.STRING(255), allowNull: true },
    logo_mark_url: { type: DataTypes.STRING(512), allowNull: true },
    logo_wordmark_url: { type: DataTypes.STRING(512), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  const now = new Date();

  await queryInterface.bulkInsert('companies', [
    {
      id: ALGORICO_COMPANY_ID,
      name: 'Algo Rico',
      slug: ALGORICO_COMPANY_SLUG,
      subtitle: 'Santa Lucía',
      logo_mark_url: '/images/logo.png',
      logo_wordmark_url: '/images/logoandalgorico.png',
      created_at: now,
      updated_at: now,
    },
    {
      id: AROME_COMPANY_ID,
      name: 'Arome',
      slug: AROME_COMPANY_SLUG,
      subtitle: 'Médanos',
      logo_mark_url: '/images/arome-logo.png',
      logo_wordmark_url: '/images/arome-logo.png',
      created_at: now,
      updated_at: now,
    },
  ]);
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('companies');
};
