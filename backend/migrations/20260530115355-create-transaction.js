'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        refrences: {
          model: 'Users', // FK ke tabel users
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // kalau user dihapus transaksi ikut kehapus
      },
      wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Wallets', // FK ke tabel wallets
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // kalau wallet dihapus transaksi ikut kehapus
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Categories', // FK ke tabel categories
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // kalau kategori dihapus transaksi ikut kehapus
      },
      type: {
        type: Sequelize.ENUM('income', 'expense'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2), // maks 999999999999.99
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      proof_image: {
        type: Sequelize.STRING(255),
        allowNull: true // bukti transaksi opsional
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Transactions');
  }
};