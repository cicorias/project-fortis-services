const AzureOAuth2Strategy = require('passport-azure-ad-oauth2');

// const config1 = {
//   clientID: '',
//   clientSecret:'',
//   callbackUri: '',
//   resource: '',
//   tenant: ''
// };

const hostUrl = 'http://localhost:8000';

const config = {
  clientID: process.env.AAD_AUTH_CLIENTID,
  clientSecret: process.env.AAD_AUTH_CLIENTSECRET,
  callbackUri: hostUrl + '/auth/cbAdfs',
  resource: process.env.MS_GRAPH_URL || 'https://graph.microsoft.com/',
  tenant: process.env.AAD_AUTH_TENANT
};

// const config = require('../config/config')

const adfsStrategy = require('./passport-adfs');
module.exports = function (passport) {
  passport.serializeUser((profile, done) => {
    done(null, profile);
  });

  passport.deserializeUser((profile, done) => {
    done(null, profile);
  });

  // ADFS signup strategy
  passport.use(
    'adfs',
    new AzureOAuth2Strategy(
      {
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: config.callbackUri,
        resource: config.resource,
        tenant: config.tenant
      },
      (accessToken, refreshToken, params, profile, done) =>
        adfsStrategy(
          accessToken,
          refreshToken,
          params,
          profile,
          done
        )
    )
  );
};
