// function to request and store individual instantaneous playback states as they are returned by spotify
const { client } = require("../config/dbConfig");
const axios = require('axios');

const { getAccessToken, setLastListened, setRequestPlayer } = require("../config/spotifyConfig");
const { refreshAccessToken } = require("./spotifyService");
const { handleListen } = require("./trackService");
const PLAYER = "https://api.spotify.com/v1/me/player";

const db = client.db();
const collectionListens = db.collection('listens');
const collectionTracks = db.collection('tracks');
const collectionTracksUnique = db.collection('tracksUnique');
const collectionTracks2 = db.collection('tracksPreBeta');
const collectionListens2 = db.collection('listensPreBeta');

universalTrackData = {
    "device": {
        "id": "",
        "is_active": true, "is_private_session": false, "is_restricted": false,
        "name": "", "supports_volume": true, "type": "", "volume_percent": 100
    },
    "shuffle_state": true, "smart_shuffle": false, "repeat_state": "off", "timestamp": 0,
    "context": {
        "external_urls": { "spotify": "https://open.spotify.com/collection/tracks" },
        "href": "https://api.spotify.com/v1/me/tracks", "type": "collection", "uri": ""
    },
    "progress_ms": 0,
    "item": {},
    "currently_playing_type": "track",
    "actions": {
        "disallows": {
            "resuming": true
        }
    },
    "is_playing": true
}

let counter = 0;
async function requestPlaybackState() {
    try {
        console.log("Requesting playback state", counter);
        counter++;
        const response = await currentlyPlaying()

        if (!response) {
            return;
        } else if (response.status === 204) {
            setLastListened(null);
            // pass, no data returned
        } else if (response.status === 200) {
            if (response.data.currently_playing_type && response.data.currently_playing_type === 'track') {
                const currentTime = new Date();
                const listen = { ingestionTime: currentTime.getTime(), listenTime: response.data.timestamp, data: response.data };
                const result = await collectionListens.insertOne(listen);


                if (result) {
                    setLastListened(listen)
                    await handleListen(listen, result);
                }
            }
        } else if (response.status === 401) {
            await refreshAccessToken();
        } else {
            return;
        }
    } catch (error) {
        console.error("Error requesting playback state:", error);
    }

}

async function currentlyPlaying(retry = true) {
    /* Make request to spotify's player endpoint to get song that is currently playing if anything is playing */
    try {
        const response = await callApi("GET", `${PLAYER}?market=US`);
        return response;
    } catch (error) {
        if (error.response && error.response.status === 401 && retry) {
            // if request is unauthorized then we likely need to refresh
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                return currentlyPlaying(false);
            }
        }
        console.error("Error fetching currently playing:", error);
    }
}

async function callApi(method, url, body = null) {
    const config = {
        method: method,
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getAccessToken()
        },
    };

    if (body && method !== 'GET') {
        config.data = body;
    }

    return axios(config);
}

let count = 0;
async function processArchiveFile(jsonData) {
    // take input json file, pass each object into processArchiveTrack
    // for now will assume each file is legitimate
    // for each item, run processArchiveTrack

    if (!Array.isArray(jsonData)) {
        console.error('JSON data is not an array. Cannot process.');
        return;
    }

    // Count the number of entries in the JSON array
    const totalEntries = jsonData.length;
    count = 0;

    for (const entry of jsonData) {
        try {
            await processArchiveTrack(entry);
        } catch (error) {
            console.error(`Error in processArchiveTrack at ${count}:`, error);
        }

    }
    console.log(`Total number of entries in archive file: ${totalEntries}`);

}

async function processArchiveTrack(track) {
    // for each track ultimately want
    // Track = {
    //   listens: [], // references to the database id of the listen
    //   listenTime: ,
    //   data: null, // data on the track from the first listen
    //   calculatedValues: {}, // potential calculated values, can be calculated at handleListen or updated dynamically over time
    // }
    count++;
    if (track.ms_played < 30000) {
        return;
    }

    const listenTime = new Date(track.ts).getTime();

    // check database to make sure this track has not already been processed
    let checkDuplicate = await collectionTracks.find({ "listenTime": listenTime }).toArray();
    if (checkDuplicate.length > 0 && checkDuplicate[0].data.item.uri === track.spotify_track_uri) {
        console.log(`Track ${count} has already been processed, from`, listenTime, checkDuplicate[0].data.item.name);
        return;
    }


    // call api to get song data correct format if the song has not already been stored
    let data = null;
    let calculatedValues = {};
    let storedTrack = await collectionTracksUnique.find({ "data.item.uri": track.spotify_track_uri }).toArray();
    console.log("Processing track", count)



    if (storedTrack.length > 0) {
        // this track has been seen before, no need to call spotify api and can just process with available info
        storedTrack = storedTrack[0].data;
        // will modify listening time and progress, then use it as the data
        storedTrack.timestamp = listenTime;
        storedTrack.progress_ms = track.ms_played;
        data = storedTrack;
    } else {
        // this track has never been seen, need to query from spotify api to get complete data
        if (track.spotify_track_uri === null) {
            console.log(`No track at ${count}, from `, listenTime);
            return;
        }
        const trackId = track.spotify_track_uri.split("track:")[1];
        try {
            const response = await callApi("GET", `https://api.spotify.com/v1/tracks/${trackId}`);
            if (response.status === 200) {
                data = JSON.parse(JSON.stringify(universalTrackData));
                data.item = response.data;
                data.timestamp = listenTime;
                data.progress_ms = track.ms_played;
                collectionTracksUnique.insertOne({data: data}); // collection meant to store each unique track seen
                await sleep(2000); // avoid rate limiting spotify api
            }
        } catch (error) {
            // handle axios errors if the key needs to be refreshed or if the client is rate limited 
            if (error.response && error.response?.status === 401) {
                console.log("Needed to refresh")
                await refreshAccessToken();
                processArchiveTrack(track);
            } else if (error.response && error.response?.status === 429) {
                console.log(`RATE LIMIT, after ${count} tracks`);
                console.error(error)
                setRequestPlayer(false)
                await sleep(3600000) //sleep for an hour hopefully it fixes itself if ever limited, more of a soft save for intervention
                setRequestPlayer(true)

            } else {
                // if not easily handleable, throw error
                throw error;
            }
        }

    }

    // process the correct number of listens
    let listenTimeOffset = 0;
    let listenTimeOffsetOriginal = 0;

    while (listenTimeOffset + listenTimeOffsetOriginal < track.ms_played) {
        let listens = [];
        while (listenTimeOffset < Math.min(track.ms_played, data.item.duration_ms)) {
            const currentTime = new Date();
            const listen = { ingestionTime: currentTime.getTime(), listenTime: listenTime + listenTimeOffset, data }
            const result = await collectionListens.insertOne(listen);
            listens.push(listen._id);
            listenTimeOffset = listenTimeOffset + 30000;
        }
        data.item.timestamp = listenTime + listenTimeOffsetOriginal;
        finalTrack = { listens: listens, listenTime: listenTime + listenTimeOffsetOriginal, data: data, calculatedValues: calculatedValues }
        const result = await collectionTracks.insertOne(finalTrack);
        listenTimeOffsetOriginal = listenTimeOffsetOriginal + listenTimeOffset;
        listenTimeOffset = 30000;
    }
}


async function getListensFromInterval(startDate, endDate) {
    try {
        let startDateObj = new Date(startDate)
        let endDateObj = new Date(endDate)
        // Only querying listening time, no data related to what was playing
        const listens = await collectionListens.find({
            listenTime: {
                $gte: startDateObj.getTime(),
                $lte: endDateObj.getTime()

            },
        }, {
            projection: {
                listenTime: 1,
                "data.item.name": 1,
                "data.item.id": 1,
                "data.item.artists.id": 1,
            }
        }).toArray();

        return listens;
    } catch (error) {
        console.error('Error fetching listens in range:', error);
        throw new Error('Unable to fetch listens.');
    }
};


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { requestPlaybackState, processArchiveFile, getListensFromInterval };