// Access tokens are strings that give access to a user's data for a limited time (1 hour)
// Refresh tokens are included when an access token is requested so that future requests don't need to be reauthorized
require('dotenv').config();

let spotifyAccessToken = null;
let spotifyRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
let spotifyRedirectURI = null;
let spotifyClientID = process.env.SPOTIFY_CLIENT_ID;
let spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;


function getAccessToken() {
  return spotifyAccessToken;
}

function setAccessToken(token) {
  if (spotifyLogging) {
    console.log("Refreshed access token")
  }
  spotifyAccessToken = token;
}

function getRefreshToken() {
  return spotifyRefreshToken;
}

function setRefreshToken(token) {
  if (spotifyLogging) {
    console.log("Refreshed refresh token")
  }
  spotifyRefreshToken = token;
}

function getRedirectURI() {
  return spotifyRedirectURI
}

function setRedirectURI(URI) {
  spotifyRedirectURI = URI
}

function getClientID() {
  return spotifyClientID
}

function getClientSecret() {
  return spotifyClientSecret
}

// Boolean to control if the schedulePlaybackState job runs, can be set in the admin control panel
let spotifyRequestPlayer = false;

function getRequestPlayer() {
  return spotifyRequestPlayer
}

function setRequestPlayer(state) {
  spotifyRequestPlayer = state
}

// Boolean to control if detailed logging messages are added to the terminal or to a logging file
let spotifyLogging = false;

function getLogging() {
  return spotifyLogging
}

function setLogging(state) {
  spotifyLogging = state
}

// variable of last listened to song
let lastListenedTo = null;

function getLastListened() {
  return lastListenedTo
}

function setLastListened(newState) {
  lastListenedTo = newState
}


module.exports = {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getRequestPlayer,
  setRequestPlayer,
  getLogging,
  setLogging,
  getRedirectURI,
  setRedirectURI,
  getClientID,
  getClientSecret,
  getLastListened,
  setLastListened,
};