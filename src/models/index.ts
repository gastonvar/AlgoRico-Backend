import { sequelize } from '../database/sequelize.js';
import { Attachment, initAttachmentModel } from './attachment.js';
import { Client, initClientModel } from './client.js';
import { Ingredient, initIngredientModel } from './ingredient.js';
import { Interaction, initInteractionModel } from './interaction.js';
import { Order, initOrderModel } from './order.js';
import { OrderItem, initOrderItemModel } from './order-item.js';
import { Payment, initPaymentModel } from './payment.js';
import { Recipe, initRecipeModel } from './recipe.js';
import { RecipeIngredient, initRecipeIngredientModel } from './recipe-ingredient.js';
import { Session, initSessionModel } from './session.js';
import { Task, initTaskModel } from './task.js';
import { User, initUserModel } from './user.js';

let initialized = false;

export function initModels(): void {
  if (initialized) {
    return;
  }

  initUserModel(sequelize);
  initSessionModel(sequelize);
  initClientModel(sequelize);
  initInteractionModel(sequelize);
  initAttachmentModel(sequelize);
  initIngredientModel(sequelize);
  initRecipeModel(sequelize);
  initRecipeIngredientModel(sequelize);
  initOrderModel(sequelize);
  initOrderItemModel(sequelize);
  initPaymentModel(sequelize);
  initTaskModel(sequelize);

  User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
  Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Interaction, { foreignKey: 'userId', as: 'interactions' });
  Interaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });
  Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  Client.hasMany(Interaction, { foreignKey: 'clientId', as: 'interactions' });
  Interaction.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

  Order.hasMany(Interaction, { foreignKey: 'orderId', as: 'interactions' });
  Interaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  Interaction.hasMany(Attachment, { foreignKey: 'interactionId', as: 'attachments' });
  Attachment.belongsTo(Interaction, { foreignKey: 'interactionId', as: 'interaction' });

  Payment.hasMany(Attachment, { foreignKey: 'paymentId', as: 'attachments' });
  Attachment.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

  Client.hasMany(Order, { foreignKey: 'clientId', as: 'orders' });
  Order.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

  Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
  OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  Recipe.hasMany(OrderItem, { foreignKey: 'recipeId', as: 'orderItems' });
  OrderItem.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

  Recipe.hasMany(RecipeIngredient, { foreignKey: 'recipeId', as: 'ingredients' });
  RecipeIngredient.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

  Ingredient.hasMany(RecipeIngredient, { foreignKey: 'ingredientId', as: 'recipeIngredients' });
  RecipeIngredient.belongsTo(Ingredient, { foreignKey: 'ingredientId', as: 'ingredient' });

  Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
  Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  Client.hasMany(Task, { foreignKey: 'clientId', as: 'tasks' });
  Task.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

  Order.hasMany(Task, { foreignKey: 'orderId', as: 'tasks' });
  Task.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  initialized = true;
}

export {
  Attachment,
  Client,
  Ingredient,
  Interaction,
  Order,
  OrderItem,
  Payment,
  Recipe,
  RecipeIngredient,
  Session,
  Task,
  User,
};
