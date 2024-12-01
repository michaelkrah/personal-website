// File for maintaining and updating the spotify api key

const axios = require('axios');
const {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
} = require('../config/spotifyConfig');


async function refreshAccessToken() {
  const refresh_token = refresh;
  let body = `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${client_id}`;

  try {
    const response = await callAuthorizationApi(body);
    handleAuthorizationResponse(response);
  } catch (error) {
    console.error("Error refreshing access token:", error);
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
      token = data.access_token;
    }
    if (data.refresh_token) {
      refresh = data.refresh_token;
    }

    return null;
  } else {
    throw new Error(response.statusText);
  }
}
