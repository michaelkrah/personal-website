const express = require('express');
const router = express.Router();
const auth = require('express-basic-auth')
const {getRequestPlayer, setRequestPlayer, getLogging, setLogging, setRedirectURI} = require('../config/spotifyConfig');
const {schedulePlaybackState} = require('../jobs/spotifyPlayback');
const { client } = require('../config/dbConfig'); 
const AUTHORIZE = "https://accounts.spotify.com/authorize";

require('dotenv').config(); 

router.use(auth({
    users: { [process.env.ADMIN]: process.env.PASSWORD },
    challenge: true,
    realm: 'admin',
}));


router.get('/', async (req, res) => {

    const db = client.db(); 
    const collection = db.collection('mySongs');
    
    try {
        const songs = await collection.find({}).sort({ _id: -1 }).limit(50).toArray();
        
        res.render('admin', {
            spotifyRequestPlayer: getRequestPlayer(),
            logState: getLogging(),
            songs: songs,
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).send('Internal Server Error');
    }

});

router.post('/toggleSpotifyRequestPlayer', (req, res) => {
    const newState = req.body.spotifyState === 'true'; 
    setRequestPlayer(newState);
    if (getRequestPlayer()) {
        schedulePlaybackState();
    }
    console.log('Updated spotifyRequestPlayer to:', newState);
    res.redirect('/admin');
})

router.post('/toggleLogging', (req, res) => {
    const newState = req.body.logState === 'true'; 
    setLogging(newState);
    console.log('Updated logging state to:', newState);
    res.redirect('/admin');
})


router.get('/authorize', async (req, res) => {
    const client_id = req.query.client_id;

    //dynamically change url based on where the site is hosted
    const baseUrl = `${req.protocol}://${req.get('host')}`; 
    const redirect_uri = `${baseUrl}/songs`; 

    setRedirectURI(redirect_uri)

    let url = AUTHORIZE;
    url += `?client_id=${client_id}`;
    url += "&response_type=code";
    url += `&redirect_uri=${encodeURI(redirect_uri)}`;
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
  
    res.redirect(url); 
  }
  )

module.exports = router