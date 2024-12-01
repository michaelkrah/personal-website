const express = require('express');
const router = express.Router();
const auth = require('express-basic-auth')
const {getRequestPlayer, setRequestPlayer} = require('../config/spotifyConfig');
require('dotenv').config(); 

router.use(auth({
    users: { [process.env.ADMIN]: process.env.PASSWORD },
    challenge: true,
    realm: 'admin',
}));


router.get('/', (req, res) => {
    res.render('admin', { spotifyRequestPlayer: getRequestPlayer() });
});

router.post('/toggleSpotifyRequestPlayer', (req, res) => {
    const newState = req.body.spotifyState === 'true'; 
    setRequestPlayer(newState);
    console.log('Updated spotifyRequestPlayer to:', newState);
    res.redirect('/admin');
})

module.exports = router