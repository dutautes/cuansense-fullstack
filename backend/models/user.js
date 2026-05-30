'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // satu user bisa punya banyak wallet, kategori, transaksi, dan transfer
      User.hasMany(models.Wallet, { foreignKey: 'user_id', as: 'wallets' });
      User.hasMany(models.Category, { foreignKey: 'user_id', as: 'categories' });
      User.hasMany(models.Transaction, { foreignKey: 'user_id', as: 'transactions' });
      User.hasMany(models.Transfer, { foreignKey: 'user_id', as: 'transfers' });
      User.hasMany(models.Budget, { foreignKey: 'user_id', as: 'budgets' });
    }
  }
  User.init({
    full_name: DataTypes.STRING(100),
    email: DataTypes.STRING(100),
    password: DataTypes.STRING(255),
    profile_picture: DataTypes.STRING(255),
  }, {
    sequelize,
    tableName: 'Users', // nama tabel sesuai migration
    modelName: 'User',
    underscored: true, // otomatis gunakan snake_case untuk kolom di database
    timestamps: true, // otomatis tambahin createdAt dan updatedAt
    createdAt: 'created_at', // nama kolom createdAt jadi created_at
    updatedAt: 'updated_at', // nama kolom updatedAt jadi updated_at
  });
  return User;
};