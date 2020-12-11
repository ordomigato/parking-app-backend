"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Permit }) {
      // define association here
      this.hasMany(Permit, { foreignKey: "userId", as: "permits" });
    }

    // hide password and id from returned object
    toJSON() {
      return { ...this.get() };
    }
  }
  User.init(
    {
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      defaultPhone: {
        type: DataTypes.STRING(20),
        defaultValue: null,
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // create user as "resident" role
        defaultValue: 4,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        login: {
          attributes: { include: ["password"] },
        },
      },
    }
  );
  return User;
};
