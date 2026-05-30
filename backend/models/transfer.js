'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transfer extends Model {
    static associate(models) {
      Transfer.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // di bedain karena satu transfer punya dua wallet yang berbeda: from_wallet dan to_wallet
      Transfer.belongsTo(models.Wallet, { foreignKey: 'from_wallet_id', as: 'from_wallet' }); // 
      Transfer.belongsTo(models.Wallet, { foreignKey: 'to_wallet_id', as: 'to_wallet' });
    }
  }
  Transfer.init({
    user_id: DataTypes.INTEGER,
    from_wallet_id: DataTypes.INTEGER,
    to_wallet_id: DataTypes.INTEGER,
    amount: DataTypes.DECIMAL(15, 2),
    description: DataTypes.TEXT,
    transfer_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Transfer',
    tableName: 'transfers',
    underscored: true,
    timestamps: true, // otomatis tambahin createdAt dan updatedAt
    createdAt: 'created_at', // nama kolom createdAt jadi created_at
    updatedAt: 'updated_at', // nama kolom updatedAt jadi updated_at
  });

  return Transfer;
};