const { client } = require('../config/dbConfig');


// will send latest listen here, it's up to this service to determine how to splice listens into tracks and store them, listens will always be immediately stored, tracks will be stored
// when complete, which might take hours ?

async function getTracksFromInterval(startDate, endDate) {
  const db = client.db();
  const collection = db.collection('mySongs');

  try {
    const tracks = await collection
      .find({ startDate: { $gte: startDate }, endDate: { $lte: endDate } })
      .toArray();
    return tracks;
  } catch (err) {
    console.error('Error fetching tracks:', err);
    throw err;
  }
}

async function topInterval(startDate, endDate, attribute) {
  const db = client.db();
  const collection = db.collection('mySongs');

  const pipelines = {
    song: [
      { $match: { startDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$trackID', trackAttribute: { $addToSet: '$trackTitle' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ],
    artist: [
      { $match: { startDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$trackArtist', trackAttribute: { $addToSet: '$trackArtist' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ],
  };

  try {
    return await collection.aggregate(pipelines[attribute]).toArray();
  } catch (err) {
    console.error('Error aggregating tracks:', err);
    throw err;
  }
}

module.exports = { getTracksFromInterval, topInterval };
