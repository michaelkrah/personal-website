const { client } = require('../config/dbConfig');


// will send latest listen here, it's up to this service to determine how to splice listens into tracks and store them, listens will always be immediately stored, tracks will be stored
// when complete, which might take hours ?

const db = client.db();
const collection = db.collection('tracksBeta');
const collectionTracks2 = db.collection('tracksPreBeta');
const collectionDateTester = db.collection('tracksBetaDateTesting');


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
  try {
    let startDateObj = new Date(startDate)
    let endDateObj = new Date(endDate)
    const tracks = await collection.find({
      listenTime: {
        $gte: startDateObj.getTime(),
        $lte: endDateObj.getTime()

      },
    }, {
      projection: {
        listenTime: 1,
        listens: 1,
        "data.item.name": 1,
        "data.item.id": 1,
        "data.item.artists.id": 1,
      }
    }
    ).toArray();
    return tracks;
  } catch (error) {
    console.error('Error fetching listens in range:', error);
    throw new Error('Unable to fetch listens.');
  }
}

async function getTopFromInterval(startDate, endDate, attribute) {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const attributeFields = {
    tracks: '$data.item.id',
    artists: '$data.item.artists.id', // Access the first artist in the array
  };

  const displayFields = {
    tracks: '$data.item.name',
    artists: '$data.item.artists.name',
  };
  const attributeField = attributeFields[attribute];
  const displayField = displayFields[attribute];

  if (!attributeField) {
    throw new Error(`Invalid attribute: ${attribute}`);
  }

  const pipeline = [
    {
      $match: {
        listenTime: {
          $gte: startDateObj.getTime(),
          $lte: endDateObj.getTime(),
        },
        "data.item.artists.0.id": { $exists: true }
      },
    },
    {
      $group: {
        _id: attributeField,
        trackAttribute: { $addToSet: displayField },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ];
  try {
    return await collection.aggregate(pipeline).toArray();
  } catch (err) {
    console.error('Error aggregating top results:', err);
    throw err;
  }
}

module.exports = { getTracksFromInterval, getTopFromInterval, handleListen };
