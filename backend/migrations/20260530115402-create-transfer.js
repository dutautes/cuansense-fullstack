'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transfers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // FK ke tabel users
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // kalau user dihapus transfer ikut kehapus
      },
      from_wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Wallets', // FK ke tabel wallets
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // kalau wallet dihapus transfer ikut kehapus
      },
      to_wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Wallets', // FK ke tabel wallets
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // kalau wallet dihapus transfer ikut kehapus
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2), // maks 999999999999.99
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      transfer_date: {
        type: Sequelize.DATE,
        allowNull: false
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
    await queryInterface.dropTable('Transfers');
  }
};