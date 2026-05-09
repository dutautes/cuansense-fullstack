'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transfers', {
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

      from_wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: 'wallets',
          key: 'id',
        },
      },

      to_wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: 'wallets',
          key: 'id',
        },
      },

      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
      },

      transfer_date: {
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
    await queryInterface.dropTable('transfers');
  }
};
