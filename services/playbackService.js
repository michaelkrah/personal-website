// function to request and store individual instantaneous playback states as they are returned by spotify

let counter = 0;
async function requestPlaybackState() {

    console.log("Requesting playback state", counter);
    counter++;
}

module.exports = {requestPlaybackState};