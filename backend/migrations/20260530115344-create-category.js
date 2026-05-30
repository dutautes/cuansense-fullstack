'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Categories', {
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
        onDelete: 'CASCADE' // kalau user dihapus kategori ikut kehapus
      },
      name: {
        type: Sequelize.STRING(100), // 
        allowNull: false
      },
      icon: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('income', 'expense'),
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
    await queryInterface.dropTable('Categories');
  }
};