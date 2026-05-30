'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Budgets', {
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
        onDelete: 'CASCADE' // kalau user dihapus budget ikut kehapus
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false // 1-12
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      limit_amount: {
        type: Sequelize.DECIMAL(15, 2), // maks 999999999999.99
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
    await queryInterface.dropTable('Budgets');
  }
};