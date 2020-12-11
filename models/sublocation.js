"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sublocation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Location }) {
      // define association here
      this.belongsTo(Location, {
        foreignKey: "locationId",
        as: "location",
        onDelete: "cascade",
        allowNull: false,
      });
    }
  }
  Sublocation.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      locationId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Sublocation",
    }
  );
  return Sublocation;
};
