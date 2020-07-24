
import user from "./models/user.model"
import bcrypt from "bcryptjs";
import Sequelize from "sequelize";
import { ApolloError } from "apollo-server-express"

const Op = Sequelize.Op;

export const resolvers = {
    Query: {
        users: async (_, args) => {

            return await user.findAll({ raw: true, where: { name: { [Op.like]: '%' + args.search + '%' } } });

        },
        me: async (_, args, context) => {


            if (!context.user) {
                const error = "ME_NOT_FOUND"
                throw new ApolloError("me could not be found ", error);
            }
            return await user.findOne({ where: { id: context.user.id } });
        }
    },
    Mutation: {
        login: async (_, { email, password }) => {
            const u = await user.findOne({ where: { email } });
            if (!u) {
                const error = "NO_USR_FOUND"
                throw new ApolloError("user does not exist!", error);
            }
            const logsucces = await bcrypt.compareSync(password, u.password);

            if (!logsucces) {

                const error = "LOG_FAILURE"
                throw new ApolloError("email or password is not correct", error);

            }

            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ id: u.id }, 'batata');
            return {
                success: true,
                message: u.name + " connected succefuly",
                token
            };
        },

        createUser: async (_, args) => {
            const { name, email, password, birthDate } = args;
            
            const u = await user.findOne({ where: { email } });
            
            if (u) {
                
                const error = "EMAIL_EXIST"
                throw new ApolloError('email ' + email + ' already exist a new one will should be given', error);
                
            }
            
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);

            const createdUser = user.build({
                name,
                email,
                password: hash,
                birthDate
            });

            await createdUser.save().then(() => {
                console.log('new user created');
            });
            return createdUser;

        },

        deleteUser: async (_, args) => {
            let u = await user.destroy({ where: { id: args.id } });

            // Check if done
            if (!u) {
                const error = "DELETE_FAILURE"
                throw new ApolloError("user cannot not be deleted, maybe the userId does not exist in the DB", error);
            }
            return {
                id: args.id,
            }
        },

        updateUser: async (_, args) => {
            const { name, email, password, birthDate } = args;
            const usercheck = user.findOne({ where: { id: args.id } });
            if (!usercheck) {
                const error = "NO_USR_FOUND"
                throw new ApolloError("user does not exist!", error);
            }

            const user_ = await user.findOne({
                where: {
                    email,
                    id: { [Op.not]: args.id }
                }
            });
            if (user_) {
                const error = "EMAIL_EXIST"
                throw new ApolloError('email ' + email + ' already exist a new one will should be given', error);
            }
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);


            const u = await user.update({
                name: name,
                email: email,
                password: hash,
                birthDate: birthDate
            }, { where: { id: args.id } });

            if (!u) {
                const error = "UPDATE_FAILURE"
                throw new ApolloError("user cannot not be updated", error);
            }
            const updatedUser = await user.findOne({where:{id:args.id}});
            return updatedUser;

            // nice, check if done, check if email exists, return user
        },
        signIn: async (_, args) => {
            const { name, email, password} = args;
            

            const u = await user.findOne({ where: { email } });

            if (u) {

                const error = "EMAIL_EXIST"
                throw new ApolloError('email ' + email + ' already exist a new one will should be given', error);

            }
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);

            const createdUser = user.build({
                name,
                email,
                password: hash,
                
            });

            await createdUser.save();
            return createdUser;

        },

    }

};