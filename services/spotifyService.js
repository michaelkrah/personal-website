// File for maintaining and access to the spotify api via an access token

const axios = require('axios');
const {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
} = require('../config/spotifyConfig');

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