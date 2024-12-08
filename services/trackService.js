const { client } = require('../config/dbConfig');


// will send latest listen here, it's up to this service to determine how to splice listens into tracks and store them, listens will always be immediately stored, tracks will be stored
// when complete, which might take hours ?

const db = client.db();
const collection = db.collection('tracksBeta');

let lastTrack = null;

// object to store tracks in the database
Track = {
  listens: [], // references to the database id of the listen
  listenTime: null,
  data: null, // data on the track from the first listen
  calculatedValues: {}, // potential calculated values, can be calculated at handleListen or updated dynamically over time
}

async function handleListen(listen, dbResult) {
  //handle the listen
  if (!lastTrack || listen.data.item.id !== lastTrack.data.item.id) {
    if (lastTrack) {
      await processTrack(lastTrack);
    }

    //create new track 
    lastTrack = {
      listens: [listen._id],
      listenTime: listen.data.timestamp,
      data: listen.data,
      calculatedValues: {},
    };
    return;
  }

  lastTrack.listens.push(listen._id)

  const totalListenTime = (lastTrack.listens.length) * 30000 // every listen object represents 30000 ms of time
  if (totalListenTime > lastTrack.data.item.duration_ms) { // track has been listened to for longer than the track length
    await processTrack(lastTrack)
    lastTrack = null;
  }
  return;
}

async function processTrack(last) {
  // if a track was listened to for less than 30 seconds then don't process it
  if (last.listens.length < 2) { 
    return false;
  }
  console.log("Inserting new object", last.listens)
  const result = await collection.insertOne(last);

  return true;
}




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

module.exports = { getTracksFromInterval, topInterval, handleListen };
