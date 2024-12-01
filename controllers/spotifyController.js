const moment = require('moment-timezone');
const { getTracksFromInterval, topInterval } = require('../services/trackService');
const { client } = require('../config/dbConfig');
const Track = require('../models/track');

const getCurrentSong = (req, res) => {
  if (currentSong) {
    res.json(currentSong);
  } else {
    res.status(404).send('No song is currently playing');
  }
};

const getTopFromInterval = async (req, res) => {
  const startDate = moment.utc(req.query.start).tz('America/New_York').toDate();
  const endDate = moment.utc(req.query.end).tz('America/New_York').add(1, 'days').toDate();
  const attribute = req.query.attribute;

  try {
    const topAttributes = await topInterval(startDate, endDate, attribute);
    res.json(topAttributes);
  } catch (error) {
    console.error('Error fetching top attributes:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  getCurrentSong,
  getTopFromInterval,
};
