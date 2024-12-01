// Access tokens are strings that give access to a user's data for a limited time (1 hour)
// Refresh tokens are included when an access token is requested so that future requests don't need to be reauthorized

let spotifyAccessToken = null;
let spotifyRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

function getAccessToken() {
  return spotifyAccessToken;
}

function setAccessToken(token) {
  spotifyAccessToken = token;
}

function getRefreshToken() {
  return spotifyRefreshToken;
}

function setRefreshToken(token) {
  spotifyRefreshToken = token;
}


// Boolean to control if the RequestPlaybackState job runs, can be set in the admin control panel
let spotifyRequestPlayer = true;

function getRequestPlayer() {
  return spotifyRequestPlayer
}

function setRequestPlayer(state) {
  spotifyRequestPlayer = state
}

module.exports = {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getRequestPlayer,
  setRequestPlayer,
};
