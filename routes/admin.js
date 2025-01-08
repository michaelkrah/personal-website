const express = require('express');
const router = express.Router();
const auth = require('express-basic-auth')
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const {getRequestPlayer, setRequestPlayer, getLogging, setLogging, setRedirectURI, setAccessToken} = require('../config/spotifyConfig');
const {schedulePlaybackState} = require('../jobs/spotifyPlayback');
const {client} = require("../config/dbConfig");
const { processArchiveFile } = require('../services/playbackService'); 
const AUTHORIZE = "https://accounts.spotify.com/authorize";

require('dotenv').config(); 

router.use(auth({
    users: { [process.env.ADMIN]: process.env.PASSWORD },
    challenge: true,
    realm: 'admin',
}));


router.get('/', async (req, res) => {

    const db = client.db(); 
    const collectionTestConnection = db.collection('mySongs');
    const collectionListens = db.collection('listens')


    
    try {
        if (getRequestPlayer()) {
            schedulePlaybackState();
        }

        const testLogins = await collectionTestConnection.find({}).sort({ _id: -1 }).limit(50).toArray();
        const listens = await collectionListens.find({}).sort({ _id: -1 }).limit(50).toArray();

        res.render('admin', {
            spotifyRequestPlayer: getRequestPlayer(),
            logState: getLogging(),
            testLogins: testLogins,
            listens: listens,
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
});

router.post('/toggleLogging', (req, res) => {
    const newState = req.body.logState === 'true'; 
    setLogging(newState);
    console.log('Updated logging state to:', newState);
    res.redirect('/admin');
});

router.post('/toggleLogging', (req, res) => {
    const newState = req.body.logState === 'true'; 
    setLogging(newState);
    console.log('Updated logging state to:', newState);
    res.redirect('/admin');
});


const upload = multer({
    dest: 'uploads/', 
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname) === '.json') {
            cb(null, true);
        } else {
            cb(new Error('Only .json files are allowed!'));
        }
    },
});

router.post('/submitArchiveData', upload.single('archiveData'), (req, res) => {

    const filePath = req.file.path;

    // Read the file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error processing file.');
        }

        try {
            const jsonData = JSON.parse(data);

             processArchiveFile(jsonData);

        } catch (parseError) {
            console.error('Invalid JSON file:', parseError);
            return res.status(400).send('Invalid JSON file.');
        }
    });

    console.log("Redirecting to admin, processing ocurring");

    res.redirect('/admin');
});




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