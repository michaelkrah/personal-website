const express = require('express');
const { getCurrentSong, getTopFromInterval } = require('../controllers/spotifyController');

const router = express.Router();


router.get('/', (req, res) => {
    res.render('songsAnalysis')
})

router.get('/api/get-current-song', getCurrentSong);
router.get('/api/get-top-from-interval', getTopFromInterval);

module.exports = router;
