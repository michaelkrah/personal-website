const express = require('express');
const router = express.Router();

const axios = require('axios');
const moment = require('moment-timezone');
const basicAuth = require('express-basic-auth');

var client_id = ""; 
var client_secret = "";
var redirect_uri = "http://localhost:3000/songs";
const AUTHORIZE = "https://accounts.spotify.com/authorize"
const PLAYER = "https://api.spotify.com/v1/me/player";
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const SEARCH = "https://api.spotify.com/v1/search";
var token = null;
var refresh = null;
var currentPlaylist = null;

class Track {
  constructor(data) {
      this.trackTitle = "_unknown";
      this.trackType = "_unknown";
      this.trackArtist = "_unknown"; // Note: trackArtist was repeated twice in the object. I'm including it only once.
      this.trackID = "_unknown";
      this.albumImage = "_unknown";
      this.releaseDate = "____-__";
      this.genres = [];
      this.trackDuration = null;
      this.startDate = new Date();
      this.endDate = this.startDate;
      this.startTime = new Date().getTime();
      this.endTime = this.startTime;
      this.data = data;
      this.artistID = "_unknown"
      this.trackAlbum = "_unknown"
  }

  toString(){
    return `${this.trackTitle} by ${this.trackArtist}`;
  }
}

var currentSong = new Track(null);

router.use(express.urlencoded({ extended: true }));
router.use(express.static('public'));

const { MongoClient } = require('mongodb');
const url = 'mongodb://127.0.0.1:27017/mydatabase'; // Replace with your MongoDB URL
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
    try {
      await client.connect();
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }
  
connectToMongoDB();

router.get('/', async (req, res) => {
if (Object.keys(req.query).length > 0) {
    return handleRedirect(req, res);
} else {
    var a = createRandomSegments()
    var b = createRandomSegments()

    data = [
    { day: 'Mon', segments: a },
    { day: 'Tue', segments: b },
    { day: 'Wed', segments: b },
    { day: 'Thr', segments: a },
    { day: 'Fri', segments: b },
    { day: 'Sat', segments: a },
    { day: 'Son', segments: a },
    ];
    let dateNum = 0;
    data.forEach(item => {
    let dateItem = new Date();
    dateItem.setDate(dateItem.getDate() - dateNum);
    item.day = dateItem;
    dateNum = dateNum - 1;
    });

    const days = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
    data.forEach(item => { 
    const date = new Date(item.day);
    let weekDay = days[date.getDay()];
    item.day = weekDay;
    });

    numDays = data.length
    res.render('calendar', {data: data, numDays: numDays});
}});

router.get('/data', async (req, res) => {
const db = client.db();
const collection = db.collection('mySongs'); // Replace 'mycollection' with your actual collection name

try {

    const data = await getTracksFromInterval();
    res.render('data', { data }); // Render a new view to display the data
} catch (error) {
    // console.error('Error fetching data from MongoDB:', error);
    console.error('Error fetching data from MongoDB:', error);
    
    res.status(500).send('Internal Server Error');
}
});

router.get('/api/get-current-song', (req, res) => {
    if (currentSong != null) {
        res.json(currentSong);
    } else {
        res.status(404).send("No song is currently playing");
    }
  });

function createRandomSegments() {
let segments = [];

for (let i = 0; i < 480; i++) {
    // Using Math.random() to decide whether to add the current index to the list
    // Here, there's roughly a 50% chance it will be added. Adjust as needed.
    
}

return segments;
}

async function getTracksFromInterval(startDate = null, endDate = new Date()) {
    try {
        const db = client.db();
        const collection = db.collection('mySongs'); // Replace placeholders with your DB and collection names
        
        if (!startDate) {
          startDate =  new Date();
          startDate.setDate(startDate.getDate() - 7);
        }
  
  
        const tracks = await collection.find({ "startDate": { "$gte": startDate}, "endDate": {"$lte": endDate} }).toArray();
        
  
        return tracks;
    } catch (err) {
        console.error('Error fetching tracks:', err);
        throw err;
    }
}

router.get('/api/get-data-from-interval', async (req, res) => {
  
    let startDate = moment.utc(req.query.start).tz("America/New_York").toDate();
    let endDate = moment.utc(req.query.end).tz("America/New_York").toDate();
  
    // If you want to adjust the endDate to the next day in EST/EDT
    endDate = moment(endDate).add(1, 'days').toDate();
  
    // Calculate the number of days difference
    numDays = moment(endDate).diff(moment(startDate), 'days');
  
    const events = await getTracksFromInterval(startDate, endDate); 
    
    let _data = [];
  
    function createEmptySegments() {
      let segments = [];
      for (let i = 0; i < 480; i++) { // For 24 hours * 20 (3-minute intervals)
          segments.push([i, null]); // Initialize with interval and null data
      }
      return segments;
    }
    
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        _data.push({
            day: new Date(d), // Clone the date
            segments: createEmptySegments()
        });
    }
  
    events.sort((a, b) => a.startTime - b.startTime);
  
    for (let event of events) {
      let newStartDate = new Date(event.startDate);
      newStartDate.setHours(newStartDate.getHours() - 5);
      let newEndDate = new Date(event.endDate);
      newEndDate.setHours(newEndDate.getHours() - 5);
      let trackDate = newStartDate.toISOString().split("T")[0];
      let trackTimeStart = newStartDate.getUTCHours() * 60 + newStartDate.getMinutes();
      let trackTimeEnd = newEndDate.getUTCHours() * 60 + newEndDate.getMinutes();
  
  
      let dayObj = _data.find(d => d.day.toISOString().split("T")[0] === trackDate);
      if (dayObj) {
        // Convert times to 3-minute interval indices
        let startIndex = Math.floor(trackTimeStart / 3);
        let endIndex = Math.floor(trackTimeEnd / 3);
        for (let i = startIndex; i <= endIndex; i++) {
            dayObj.segments[i][1] = {trackTitle: event.trackTitle, trackId: event.trackID, genres: event.genres, releaseDate: event.releaseDate, trackArtist: event.trackArtist, trackAlbum: event.trackAlbum}; // Assign the track to the segment
        }
        for (let i = startIndex; i <= endIndex; i++) {
        }
        
      }
     
    }
    const db = client.db();
    const collection = db.collection('mySongs');
    res.json({_data, numDays} )
})
  
async function topInterval(startDate, endDate, request) {
    //songs
    const db = client.db();
    const collection = db.collection('mySongs');
    if (request === "song") {
      const pipeline = [
        { $match: { "startDate": { "$gte": startDate, "$lte": endDate } } },
        { $group: { _id: "$trackID", trackAttribute: { $addToSet: "$trackTitle" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 } 
      ];
      let topSongs = await collection.aggregate(pipeline).toArray();
      return topSongs
    } else if (request === "artist") {
      const pipeline2 = [
        { $match: { "startDate": { "$gte": startDate, "$lte": endDate } } },
        { $group: { _id: "$trackArtist", trackAttribute: { $addToSet: "$trackArtist" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 } 
      ];
      let topArtists = await collection.aggregate(pipeline2).toArray();
      return topArtists
    } else if (request === "genre") {
      const pipeline3 = [
        { $match: { "startDate": { "$gte": startDate, "$lte": endDate } } },
        { $unwind: "$genres" },  // Deconstruct the genre array
        { $group: { _id: "$genres", trackAttribute: { $addToSet: "$genres"}, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 } 
      ];
      let topGenres = await collection.aggregate(pipeline3).toArray();
      return topGenres
    } else if (request === "album") {
      const pipeline4 = [
        { $match: { "startDate": { "$gte": startDate, "$lte": endDate } } },
        { $group: { _id: "$trackAlbum", trackAttribute: { $addToSet: "$trackAlbum" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 } 
      ];
      let topAlbums = await collection.aggregate(pipeline4).toArray();
      return topAlbums
    }
  }
  
router.get('/api/get-top-from-interval', async (req, res) => {
    let startDate = req.query.start;
    let endDate = req.query.end;
    startDate = moment.utc(req.query.start).tz("America/New_York").toDate();
    endDate = moment.utc(req.query.end).tz("America/New_York").toDate();
    endDate = moment(endDate).add(1, 'days').toDate();
    const attribute = req.query.attribute
    let topAttributes = await topInterval(startDate, endDate, attribute)
    res.json(topAttributes)
})

async function callApi(method, url, body = null) {
    const config = {
        method: method,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
      },
    };
  
    if (body && method !== 'GET') {
        config.data = body;
    }
  
    return axios(config);
}

function handleRedirect(req, res) {
    // Implement your redirect handling logic here
    const code = req.query.code;
    console.log(code)
    if (code) {
      fetchAccessToken(code).then(data => {
        // Here, you'd usually store the access token in a session or cookie for further use.
        // req.session.accessToken = accessToken; // Assuming you've setup express-session
        token = data.access_token;
        refresh = data.refresh_token
        console.log("data", data)
        console.log("token", token)
        console.log("refresh", refresh)
  
        // Redirect to another page or render a view, depending on your needs
        res.redirect('/songs')}).catch(err => {
          // Handle errors
          res.status(500).send("Error fetching access token");
      });
    } else {
      res.status(400).send("Missing code parameter");
  }
};
  
function fetchAccessToken(code) {
    const authOptions = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        params: {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri,
            client_id: client_id,
            client_secret: client_secret
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
  
    return axios(authOptions).then(response => {
        return response.data;
    });
}
  
async function artist(artist){
    try {
      const response = await callApi("GET", `https://api.spotify.com/v1/artists/${artist}`);
      return handleArtist(response);
    } catch (error) {
      console.error(error)
    }
}
  
async function handleArtist(response) {
    if (response.status == 200) {
      
      const data = response.data;
      return data
    } else if (response.status == 429) {
      throw new Error("too many api calls");
  
    }
     else {
      console.error("error message in artist response");
      return null;
    }
}
  
async function currentlyPlaying(retry = true) {
    try {
        const response = await callApi("GET", `${PLAYER}?market=US`);
        return handleCurrentlyPlayingResponse(response);
    } catch (error) {
      if (error.response && error.response.status === 401 && retry) { 
        // If it's a 401 error and we haven't retried yet
        console.log("we are here currently refreshing the token!!!!")
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return currentlyPlaying(false); // Retry fetching, but don't allow further retries
        }
    }
      console.error("Error fetching currently playing:", error);
      console.error("Error fetching currently playing:");
      var result = new Track({});
      return result;
    }
}
  
function handleCurrentlyPlayingResponse(response) {
    if (response.status == 200) {
        const data = response.data;
        var result = new Track(data);
        if (Object.keys(data).length != 0) {
            if (data.currently_playing_type === 'unknown') {
                //pass, nothing is needed
            } else if (data.item.uri.includes("spotify:local")) {
                result.trackTitle = "_local";
                result.trackType = "_local";
                result.trackArtist = "_local";
                result.trackID = "_local";
                result.albumImage = "_local";
            } else if (data.currently_playing_type === 'track') {
                result.trackTitle = data.item.name;
                result.trackType = "track";
                result.trackArtist = data.item.artists[0].name;
                result.trackID = data.item.id;
                result.albumImage = data.item.album.images[0].url;
                result.trackDuration = data.item.duration_ms;
                result.releaseDate = data.item.album.release_date;
                result.artistID = data.item.artists[0].id;
                result.trackAlbum = data.item.album.name;
            } else if (data.currently_playing_type === 'episode') {
                result.trackTitle = "_episode";
                result.trackType = "_episode";
                result.trackArtist = "_episode";
                result.trackID = "_episode";
                result.albumImage = "_episode";
            } else if (data.currently_playing_type === 'ad') {
                result.trackTitle = "_ad";
                result.trackType = "_ad";
                result.trackArtist = "_ad";
                result.trackID = "_ad";
                result.albumImage = "_ad";
            }
        }
        // I've omitted the device and playlist parts as you wanted the song details in JSON.
        // If you need them, you can easily add them to the `result` object as done above.
  
        return result;
  
    } else if (response.status == 204) {
        var result = new Track({});
        return result
        
    } else if (response.status == 401) {
        // Handle token refresh logic here if necessary
        refreshAccessToken()
        var result =new Track({});
        return result;
    } else {
        // console.error(response.statusText);
        console.error("error message in handlecurrentlyplaying response");
        var result = new Track({});
        return result;
    }
}
  
function handlePlaylistsResponse(response) {
    if (response.status === 200) {
        // removeAllItems("playlists");
        // response.data.items.forEach(item => addPlaylist(item));
        // If you're working within an environment with DOM access:
        // document.getElementById('playlists').value = currentPlaylist;
    } else if (response.status === 401) {
        // Refresh the token or handle the unauthorized error
        refreshAccessToken();
    } else {
        // handle non-200 status code as per your requirement
    }
}
  
async function refreshAccessToken() {
    const refresh_token = refresh;
    let body = `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${client_id}`;
    
    try {
        const response = await callAuthorizationApi(body);
        handleAuthorizationResponse(response);
    } catch (error) {
        // console.error("Error refreshing access token:", error);
        console.error("Error refreshing access token:");
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
        console.error("Error calling the API:", error);
        console.error("Error calling API:");
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
  
        return null; // Ensure this function is defined or replace it with a relevant function
    } else {
      console.log("handle auth reponse error");  
      // console.error(response.statusText);
        throw new Error(response.statusText);
    }
}

router.use('/2414xfta', basicAuth({
    users: { '': '' },
    challenge: true,
    realm: 'Imb4T3st4pp',
}));
  
router.get('/2414xfta', async (req, res) => {
    res.render('login.ejs')
  }
)

router.get('/authorize', async (req, res) => {
    const client_id = req.query.client_id;
  
    // Construct the authorization URL
    let url = AUTHORIZE;
    url += `?client_id=${client_id}`;
    url += "&response_type=code";
    url += `&redirect_uri=${encodeURI(redirect_uri)}`;
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
  
    res.redirect(url); // Redirect user to Spotify's authorization screen
  }
)

async function makeAPICall() {
    try {
  
    
      song = await currentlyPlaying();
      let genres = [];
      song.genres = genres;
      
  
      updateSong(song);
      console.log(currentSong.toString(), currentSong.genres);
    } catch (error) {
      console.error('Error making API call:', error);
    }
}
  
async function  updateSong(songData) {
  if (songData === null){
    return null;
  }
  currentTime = new Date().getTime();
  currentDate = new Date();
  if (!currentSong) {
    songData.startTime = currentTime;
    songData.startDate = currentDate;
    currentSong = songData;
    return null;
  }
  if (songData.trackType != "track") {
    if (currentSong.trackType === "track") {
      currentSong.endTime = currentTime;
      currentSong.endDate = currentDate;

      artistID = currentSong.data.item.artists[0].id;
      let genres = await artist(artistID);
      try {
        genres = genres.genres;
        currentSong.genres = genres
      } catch {
        currentSong.genres = []
      }
      
      storeData(currentSong);
      songData.startTime = currentTime;
      songData.startDate = currentDate;

      currentSong = songData;
      return null;
    } else {
      currentSong = songData;
      return null;
    }
  }
  if (songData.trackID != currentSong.trackID) {
    currentSong.endTime = currentTime;
    currentSong.endDate = currentDate;
    if (currentSong.endTime - currentSong.startTime > 30000) {
      if (currentSong.trackType === "track") {
        artistID = currentSong.data.item.artists[0].id;
        let genres = await artist(artistID);
        try {
          genres = genres.genres;
          currentSong.genres = genres
        } catch {
          currentSong.genres = []
        }
        storeData(currentSong); //only store a song if it has been playing for longer than 30 seconds
      }
    } else {
      
    }
    songData.startTime = currentTime;
    songData.startDate = currentDate;

    currentSong = songData;
    return null;
  }
  time = currentSong.trackDuration;
  startTime = currentSong.startTime;
  difference = currentTime - startTime;
  if (difference > time) {
    currentSong.endTime = currentTime;
    currentSong.endDate = currentDate;
    artistID = currentSong.data.item.artists[0].id;
    let genres = await artist(artistID);
    try {
      genres = genres.genres;
      currentSong.genres = genres
    } catch {
      currentSong.genres = []
    }
    storeData(currentSong);
    songData.startTime = currentTime;
    currentSong.startDate = currentDate;
    currentSong = songData;
  }
}
  
function storeData(data) {
    console.log("storing data")
    const db = client.db();
    const collection = db.collection('mySongs');
  
    try {
      const result = collection.insertOne(data);
    } catch (error) {
      console.error('Error inserting document:', error);
    }
}
  
const interval = 30000; // 30 seconds in between API calls
const apiCallInterval = setInterval(makeAPICall, interval);
makeAPICall()

module.exports = router