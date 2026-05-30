'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      // wallet milik satu user
      Wallet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // wallet bisa punya banyak transaksi 
      Wallet.hasMany(models.Transaction, { foreignKey: 'wallet_id', as: 'transactions' });
      // wallet bisa jadi asal atau tujuan transfer
      Wallet.hasMany(models.Transfer, { foreignKey: 'from_wallet_id', as: 'transfers_out' });
      Wallet.hasMany(models.Transfer, { foreignKey: 'to_wallet_id', as: 'transfers_in' });
    }
  }
  Wallet.init({
    user_id: DataTypes.INTEGER,
    name: DataTypes.STRING(100),
    balance: DataTypes.DECIMAL(15, 2),
    color: DataTypes.STRING(50),
  }, {
    sequelize,
    modelName: 'Wallet',
    tableName: 'Wallets', // nama tabel sesuai migration
    underscored: true, // otomatis gunakan snake_case untuk kolom di database
    timestamps: true, // otomatis tambahin createdAt dan updatedAt
    createdAt: 'created_at', // nama kolom createdAt jadi created_at
    updatedAt: 'updated_at', // nama kolom updatedAt jadi updated_at
  });
  return Wallet;
};