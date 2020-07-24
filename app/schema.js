import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type User {
    id: ID!
    name: String
    email: String
    password: String
    birthDate: String  
  }

  type LoginResponse {
    success: Boolean!
    message: String
    token: String
  }

  type Query {
    users(search: String): [User]
    me: User
  }

  type Mutation {
    login(email:String password:String): LoginResponse
    signIn(name:String, email: String password:String): User
    createUser(name: String email: String password:String birthDate: String): User 
    deleteUser(id: ID!): User
    updateUser(id: ID! name: String email: String password:String birthDate: String): User 
  }
`;