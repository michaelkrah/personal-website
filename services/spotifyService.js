// File for accessing and maintaining access to the spotify api via an access token and authorization

const axios = require('axios');
const {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getRedirectURI,
  getClientID,
  getClientSecret,
  setRequestPlayer,
  getRequestPlayer,
} = require('../config/spotifyConfig');

const { schedulePlaybackState } = require('../jobs/spotifyPlayback');

async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  let body = `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${client_id}`;

  try {
    const response = await callAuthorizationApi(body);
    handleAuthorizationResponse(response);
    return true;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return false
  }
}

async function callAuthorizationApi(body) {
  try {
    const response = await axios.post(TOKEN, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(client_id + ":" + client_secret).toString('base64')
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

function handleAuthorizationResponse(response) {
  if (response.status === 200) {
    const data = response.data;

    if (data.access_token) {
      setAccessToken(data.access_token);
    }
    if (data.refresh_token) {
      setRefreshToken(data.refresh_token);
    }
    return null;
  } else {
    throw new Error(response.statusText);
  }
}

// for initial authorization
async function handleRedirect(req, res) {
  const code = req.query.code;
  if (code) {
    try {
      const authOptions = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        params: {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: getRedirectURI(),
          client_id: getClientID(),
          client_secret: getClientSecret()
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const response = await axios(authOptions);
      const responseData = response.data;
      setAccessToken(responseData.access_token);
      setRefreshToken(responseData.refresh_token);

      // Automatically activates schedulePlaybackState after login is complete  
      setRequestPlayer(true);
      if (getRequestPlayer()) {
        schedulePlaybackState();
      }

      res.redirect('/songs'); 
    } catch (error) {
      throw error;
    }
  } else {
    throw new Error("No code provided");
  }
};


module.exports = {refreshAccessToken, handleRedirect};