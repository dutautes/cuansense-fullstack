'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // kategori milik satu user
      Category.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // satu kategori bisa dipakai di banyak transaksi
      Category.hasMany(models.Transaction, { foreignKey: 'category_id', as: 'transactions' });
    }
  }
  Category.init({
    user_id: DataTypes.INTEGER,
    name: DataTypes.STRING(100),
    icon: DataTypes.STRING(100),
    type: DataTypes.ENUM('income', 'expense'),
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'Categories', // nama tabel sesuai migration
    underscored: true, // otomatis gunakan snake_case untuk kolom di database
    timestamps: true, // otomatis tambahin createdAt dan updatedAt
    createdAt: 'created_at', // nama kolom createdAt jadi created_at
    updatedAt: 'updated_at', // nama kolom updatedAt jadi updated_at

  });
  return Category;
};