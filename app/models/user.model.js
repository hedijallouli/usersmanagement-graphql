const Sequelize = require('sequelize');
const { DataTypes } = require("sequelize");

const path = 'mysql://root:root@localhost:8889/batata';
const sequelize = new Sequelize(path, {
    logging: true
});

const User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        field: 'birth_date',
        allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

export default User;