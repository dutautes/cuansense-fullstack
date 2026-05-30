'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      // transaksi punya relasi ke 3 tabel sekaligus: user, wallet, kategori
      Transaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Transaction.belongsTo(models.Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
      Transaction.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    }
  }

  Transaction.init({
    user_id: DataTypes.INTEGER,
    wallet_id: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    type: DataTypes.ENUM('income', 'expense'),
    amount: DataTypes.DECIMAL(15, 2),
    description: DataTypes.TEXT,
    transaction_date: DataTypes.DATE,
    proof_image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
    timestamps: true, // otomatis tambahin createdAt dan updatedAt
    createdAt: 'created_at', // nama kolom createdAt jadi created_at
    updatedAt: 'updated_at', // nama kolom updatedAt jadi updated_at

  });
  return Transaction;
};