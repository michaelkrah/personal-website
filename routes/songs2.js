const express = require('express');
const { getCurrentSong, getTopFromInterval } = require('../controllers/spotifyController');
const {handleRedirect} = require('../services/spotifyService')
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        if (Object.keys(req.query).length > 0) {
            await handleRedirect(req, res);
        }
        else {
            res.render('songsAnalysis')
        }
    } catch (error) {
        console.error('Error in handleMainRoute:', error);
        res.status(500).send('An error occurred.');
    }
})

router.get('/api/get-current-song', getCurrentSong);
router.get('/api/get-top-from-interval', getTopFromInterval);

module.exports = router;
