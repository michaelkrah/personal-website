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

module.exports = {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
};
