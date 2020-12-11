"use strict";
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable("Locations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      maxFormDuration: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: 31,
      },
      maxMonthlyDuration: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: 31,
      },
      curfewReset: {
        type: DataTypes.TIME,
        defaultValue: "00:00:00",
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable("Locations");
  },
};
