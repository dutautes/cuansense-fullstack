'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Budget extends Model {
    static associate(models) {
      Budget.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  Budget.init({
    user_id: DataTypes.INTEGER,
    month: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    limit_amount: DataTypes.DECIMAL(15, 2)
  }, {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    underscored: true,
    timestamps: true, // otomatis tambahin createdAt dan updatedAt
    createdAt: 'created_at', // nama kolom createdAt jadi created_at
    updatedAt: 'updated_at', // nama kolom updatedAt jadi updated_at
  });

  return Budget;
};