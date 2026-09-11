import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator.js';

export const up: Migration['up'] = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  await queryInterface.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('sessions', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('clients', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    instagram_username: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    needs_follow_up: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    archived_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('interactions', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    channel: { type: DataTypes.STRING(32), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    occurred_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('attachments', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    interaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'interactions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    original_filename: { type: DataTypes.STRING(255), allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    file_size: { type: DataTypes.INTEGER, allowNull: false },
    storage_key: { type: DataTypes.STRING(512), allowNull: false, unique: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('products', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    default_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('orders', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'LEAD' },
    event_date: { type: DataTypes.DATEONLY, allowNull: true },
    event_time: { type: DataTypes.STRING(5), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    fulfillment_type: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'PICKUP' },
    delivery_address: { type: DataTypes.TEXT, allowNull: true },
    delivery_time: { type: DataTypes.STRING(5), allowNull: true },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: '0.00' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('order_items', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'orders', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'products', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    description: { type: DataTypes.STRING(500), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('payments', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'orders', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    type: { type: DataTypes.STRING(16), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    payment_method: { type: DataTypes.STRING(32), allowNull: false },
    paid_at: { type: DataTypes.DATE, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('tasks', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    client_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'orders', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    due_at: { type: DataTypes.DATE, allowNull: true },
    priority: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'MEDIUM' },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('sessions', ['user_id'], { name: 'sessions_user_id_idx' });
  await queryInterface.addIndex('sessions', ['expires_at'], { name: 'sessions_expires_at_idx' });

  await queryInterface.addIndex('clients', ['name'], { name: 'clients_name_idx' });
  await queryInterface.addIndex('clients', ['phone'], { name: 'clients_phone_idx' });
  await queryInterface.addIndex('clients', ['instagram_username'], {
    name: 'clients_instagram_username_idx',
  });
  await queryInterface.addIndex('clients', ['needs_follow_up'], {
    name: 'clients_needs_follow_up_idx',
  });
  await queryInterface.addIndex('clients', ['archived_at'], { name: 'clients_archived_at_idx' });

  await queryInterface.sequelize.query(
    'CREATE INDEX clients_name_trgm_idx ON clients USING gin (name gin_trgm_ops);',
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX clients_phone_trgm_idx ON clients USING gin (phone gin_trgm_ops);',
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX clients_instagram_trgm_idx ON clients USING gin (instagram_username gin_trgm_ops);',
  );

  await queryInterface.addIndex('interactions', ['client_id', 'occurred_at'], {
    name: 'interactions_client_id_occurred_at_idx',
  });
  await queryInterface.addIndex('attachments', ['interaction_id'], {
    name: 'attachments_interaction_id_idx',
  });

  await queryInterface.addIndex('products', ['active'], { name: 'products_active_idx' });
  await queryInterface.addIndex('products', ['name'], { name: 'products_name_idx' });

  await queryInterface.addIndex('orders', ['client_id'], { name: 'orders_client_id_idx' });
  await queryInterface.addIndex('orders', ['event_date'], { name: 'orders_event_date_idx' });
  await queryInterface.addIndex('orders', ['status'], { name: 'orders_status_idx' });
  await queryInterface.addIndex('orders', ['event_date', 'status'], {
    name: 'orders_event_date_status_idx',
  });

  await queryInterface.addIndex('order_items', ['order_id'], { name: 'order_items_order_id_idx' });
  await queryInterface.addIndex('payments', ['order_id'], { name: 'payments_order_id_idx' });

  await queryInterface.addIndex('tasks', ['due_at'], { name: 'tasks_due_at_idx' });
  await queryInterface.addIndex('tasks', ['completed'], { name: 'tasks_completed_idx' });
  await queryInterface.addIndex('tasks', ['completed', 'due_at'], {
    name: 'tasks_completed_due_at_idx',
  });
  await queryInterface.addIndex('tasks', ['client_id'], { name: 'tasks_client_id_idx' });
  await queryInterface.addIndex('tasks', ['order_id'], { name: 'tasks_order_id_idx' });
};

export const down: Migration['down'] = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('tasks');
  await queryInterface.dropTable('payments');
  await queryInterface.dropTable('order_items');
  await queryInterface.dropTable('orders');
  await queryInterface.dropTable('products');
  await queryInterface.dropTable('attachments');
  await queryInterface.dropTable('interactions');
  await queryInterface.dropTable('clients');
  await queryInterface.dropTable('sessions');
  await queryInterface.dropTable('users');
};
