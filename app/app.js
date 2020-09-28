import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './schema.js'
import { resolvers } from './resolver.js'
import cors from 'cors';

const app = express();

var jwt = require('express-jwt');
const auth = jwt({
  secret: 'batata',
  credentialsRequired: false,
  algorithms: ['HS256']
})

const server = new ApolloServer({
  typeDefs, resolvers,
  context: ({ req }) => {
    return {
      user: req.user
    }
  }
});

app.use(server.graphqlPath, auth);

// CORS Policy
var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)) 
console.log('[CORS] Origin policy: ' + corsOptions.origin);

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
