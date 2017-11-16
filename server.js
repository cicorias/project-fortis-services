'use strict';
require('dotenv').config();
console.log(`DEBUG ${process.env.DEBUG}`);
const debug = require('debug')('fortis:host');

const port = process.env.PORT || 8000;

require('./src/clients/appinsights/AppInsightsClient').setup();
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');

const EdgesSchema = require('./src/schemas/EdgesSchema');
const MessageSchema = require('./src/schemas/MessageSchema');
const SettingsSchema = require('./src/schemas/SettingsSchema');
const TileSchema = require('./src/schemas/TilesSchema');

const resolversDirectory = process.env.ENABLE_V2 ? './src/resolvers-cassandra' : './src/resolvers';
const EdgesResolver = require(`${resolversDirectory}/Edges`);
const MessageResolver = require(`${resolversDirectory}/Messages`);
const SettingsResolver = require(`${resolversDirectory}/Settings`);
const TileResolver = require(`${resolversDirectory}/Tiles`);

const app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-ms-meta-data*,x-ms-meta-target*,x-ms-meta-abc');

   // intercept OPTIONS method
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use('/api/messages', graphqlHTTP({
  schema: MessageSchema,
  rootValue: MessageResolver,
  graphiql: true
}));

app.use('/api/edges', graphqlHTTP({
  schema: EdgesSchema,
  rootValue: EdgesResolver,
  graphiql: true
}));

app.use('/api/tiles', graphqlHTTP({
  schema: TileSchema,
  rootValue: TileResolver,
  graphiql: true
}));

app.use('/api/settings', graphqlHTTP({
  schema: SettingsSchema,
  rootValue: SettingsResolver,
  graphiql: true
}));

/// authN *****
/// TODO: actual implementation.
const passport = require('passport');
const authCheck = require('./src/authCheck');
require('./src/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/profile', authCheck(), (req, res) => {
  // res.sendStatus(401);
  // res.json({ data: { user: { firstName: 'john', lastName: 'doe', email: 'jon@doe.com'}}});
  var user = req.session.passport;
  res.json(user);
});

app.use('/auth', require('./src/auth'));

/// authN END...  ****** 

function startServer() {
  debug(`PORT: ${port}`);
  const server = http.createServer(app);
  server.listen(port, function () {});
}

const serverStartBlocker = process.env.ENABLE_V2
  ? require('./src/clients/cassandra/CassandraConnector').initialize()
  : require('promise').resolve();

serverStartBlocker.then(startServer).catch(console.error);