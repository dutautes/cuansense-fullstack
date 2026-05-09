'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
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

        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM('income', 'expense'),
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
    await queryInterface.dropTable('categories');
  }
};
