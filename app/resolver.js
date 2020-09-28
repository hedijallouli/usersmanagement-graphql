
import user from "./models/user.model"
import bcrypt from "bcryptjs";
import Sequelize from "sequelize";
import { ApolloError } from "apollo-server-express"
import { promisify } from 'util';
import randomBytes from "randombytes"
import nodemailer from "nodemailer"


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
            const logsucces = bcrypt.compareSync(password, u.password);

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

            const salt = await bcrypt.genSaltSync(10);
            const hash = await bcrypt.hashSync(password, salt);



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
            const data = {
                name: name,
                email: email,
                birthDate: birthDate
            }

            if (password) {
                const salt = await bcrypt.genSaltSync(10);
                data.password = await bcrypt.hashSync(password, salt);
            }

            const u = await user.update(data, { where: { id: args.id } });

            if (!u) {
                const error = "UPDATE_FAILURE"
                throw new ApolloError("user cannot not be updated", error);
            }
            const updatedUser = await user.findOne({ where: { id: args.id } });
            return updatedUser;

            // nice, check if done, check if email exists, return user
        },

        updateUsersPassword: async (_, args) => {
            const { oldPassword, newPassword } = args;
            const usercheck = await user.findOne({ where: { id: args.id } });
            if (!usercheck) {
                const error = "NO_USR_FOUND"
                throw new ApolloError("user does not exist!", error);
            }

            const passCheck = await bcrypt.compareSync(oldPassword, usercheck.password);

            if (!passCheck) {
                const error = "WRONG_PASSWORD"
                throw new ApolloError("password is wrong", error);
            }

            const salt = await bcrypt.genSaltSync(10);
            const updatedPassword = await bcrypt.hashSync(newPassword, salt);

            const data = {
                password: updatedPassword
            }

            const u = await user.update(data, { where: { id: args.id } });

            if (!u) {
                const error = "UPDATE_FAILURE"
                throw new ApolloError("user cannot not be updated", error);
            }
            const updatedUser = await user.findOne({ where: { id: args.id } });
            return updatedUser;

            // nice, check if done, check if email exists, return user
        },
        signIn: async (_, args) => {
            const { name, email, password } = args;


            const u = await user.findOne({ where: { email } });

            if (u) {

                const error = "EMAIL_EXIST"
                throw new ApolloError('email ' + email + ' already exist a new one will should be given', error);

            }
            const salt = await bcrypt.genSaltSync(10);
            const hash = await bcrypt.hashSync(password, salt);

            const createdUser = user.build({
                name,
                email,
                password: hash,

            });

            await createdUser.save();
            return createdUser;

        },
        requestReset: async (_, { email }) => {
            email = email.toLowerCase();

            // Check that user exists.
            const usertofind = await user.findAll({
                where: {
                    email: email
                },
                plain: true
            });

            if (!usertofind) throw new Error("No user found with that email.");

            // Create randomBytes that will be used as a token
            const randomBytesPromisified = promisify(randomBytes);
            const resetToken = (await randomBytesPromisified(20)).toString("hex");
            const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

            // Add token and tokenExpiry to the db user
            const result = await user.update(
                { resetToken, resetTokenExpiry },
                {
                    where: { email },
                    returning: true,
                    plain: true
                }
            );

            // Email them the token
            var transport = nodemailer.createTransport({
                host: "smtp.mailtrap.io",
                port: 2525,
                auth: {
                  user: "79e40f29a02bd0",
                  pass: "0ba24f8bc3d5fe"
                }
              });
              var mailOptions = {
                from: '"userfy" <pswreset@userfy.com>',
                to: email,
                subject: '"Your Password Reset Token',
                text: 'Hey there, it’s your token sent with Nodemailer ;) : '+ resetToken, 
               
            };
            transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
        });

            return true;
        },
        resetPassword: async (_, { email, password, confirmPassword, resetToken },

        ) => {
            email = email.toLowerCase();
            // check if passwords match
            if (password !== confirmPassword) {
                throw new Error(`Your passwords don't match`);
            }

            // find the user with that resetToken
            // make sure it's not expired
            const usertofind = await user.findAll({
                where: {
                    resetToken,
                    resetTokenExpiry: {
                        [Op.gte]: Date.now() - 3600000
                    }
                },
                plain: true
            });

            // throw error if user doesn't exist
            if (!usertofind)
                throw new Error(
                    "Your password reset token is either invalid or expired."
                );

            const saltRounds = await bcrypt.genSaltSync(10);;
            const hash = await bcrypt.hash(password, saltRounds);

            const result = await user.update(
                {
                    password: hash,
                    resetToken: null,
                    resetTokenExpiry: null
                },
                {
                    where: { id: usertofind.id },
                    returning: true,
                    plain: true
                }
            );
            // sequelize puts our result in an array, in the 2nd slot (first slot give affected rows)
            const updatedUser = await user.findOne({ where: { id: usertofind.id} });

            
            return updatedUser;
            
        }



    }

};