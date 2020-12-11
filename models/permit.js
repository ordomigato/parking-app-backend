"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Permit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Location, Sublocation }) {
      // define association here
      this.belongsTo(User, { foreignKey: "userId", as: "user" });
      this.belongsTo(Location, { foreignKey: "locationId", as: "location" });
      this.belongsTo(Sublocation, {
        foreignKey: "sublocationId",
        as: "sublocation",
      });
    }
  }
  Permit.init(
    {
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
    },
    {
      sequelize,
      modelName: "Permit",
    }
  );
  return Permit;
};
