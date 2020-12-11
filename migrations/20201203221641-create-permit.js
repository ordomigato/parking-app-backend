"use strict";
module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable("Permits", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      vplate: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      vmake: {
        type: DataTypes.STRING(20),
        defaultValue: null,
      },
      vmodel: {
        type: DataTypes.STRING(20),
        defaultValue: null,
      },
      vcolor: {
        type: DataTypes.STRING(20),
        defaultValue: null,
      },
      userId: {
        type: DataTypes.INTEGER(11),
        defaultValue: null,
      },
      locationId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },
      sublocationId: {
        type: DataTypes.INTEGER(11),
        defaultValue: null,
      },
      unit: {
        type: DataTypes.STRING(20),
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING(100),
        defaultValue: null,
      },
      phone: {
        type: DataTypes.STRING(20),
        defaultValue: null,
      },
      firstName: {
        type: DataTypes.STRING(100),
        defaultValue: null,
      },
      lastName: {
        type: DataTypes.STRING(100),
        defaultValue: null,
      },
      phone: {
        type: DataTypes.STRING(20),
        defaultValue: null,
      },
      duration: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      expDate: {
        type: DataTypes.DATE,
        defaultValue: null,
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
    await queryInterface.dropTable("Permits");
  },
};
