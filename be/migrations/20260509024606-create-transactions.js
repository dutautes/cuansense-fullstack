'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: 'users',
          key: 'id',
        },
      },

      wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: 'wallets',
          key: 'id',
        },
      },

      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: 'categories',
          key: 'id',
        },
      },

      type: {
        type: Sequelize.ENUM('income', 'expense'),
        allowNull: false,
      },

      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
      },

      proof_image: {
        type: Sequelize.STRING,
      },

      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
};
