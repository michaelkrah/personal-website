const express = require('express');
const { getLastListened, getAnalysisFromRange } = require('../controllers/spotifyController');
const { handleRedirect } = require('../services/spotifyService')
const { getListensFromInterval } = require('../services/playbackService')

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        if (Object.keys(req.query).length > 0) {
            await handleRedirect(req, res);
        }
        else {
            const endDateObj = new Date();
            const startDateObj = new Date(endDateObj);
            startDateObj.setDate(endDateObj.getDate() - 6);
            endDateObj.setDate(endDateObj.getDate() + 1);
            const startDate = startDateObj.toISOString().split('T')[0];
            const endDate = endDateObj.toISOString().split('T')[0];

            const analysisFromRange = await getAnalysisFromRange(startDate, endDate);


            res.render('songsAnalysis', analysisFromRange)
        }
    } catch (error) {
        console.error('Error in handleMainRoute:', error);
        res.status(500).send('An error occurred.');
    }
})

router.post('/api/send-date-range', async (req, res) => {
    const analysisFromRange = await getAnalysisFromRange(req.body.startDate, req.body.endDate);
    res.json(analysisFromRange)
})


module.exports = router;
