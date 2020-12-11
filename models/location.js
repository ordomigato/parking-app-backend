"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Permit, Sublocation }) {
      // define association here
      this.hasMany(Permit, { foreignKey: "locationId", as: "permits" });
      this.hasMany(Sublocation, {
        foreignKey: "locationId",
        as: "sublocations",
        onDelete: "cascade",
        allowNull: false,
        hooks: true,
      });
    }
  }
  Location.init(
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
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
        // midnight
        defaultValue: "23:59:59",
      },
    },
    {
      sequelize,
      modelName: "Location",
    }
  );
  return Location;
};
