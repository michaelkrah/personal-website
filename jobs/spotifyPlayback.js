const {getRequestPlayer} = require('../config/spotifyConfig');
const {requestPlaybackState} = require('../services/playbackService')

let playbackJob = null;

async function schedulePlaybackState() {
    if (!playbackJob) {
        playbackJob = setInterval( async () => {
            try {
                if (!getRequestPlayer()) {
                    clearInterval(playbackJob);
                    playbackJob = null;
                    return
                }
                await requestPlaybackState();
                
            } catch (error) {
                console.error('Error during Spotify playback check:', error);
            }
        }, 5000);
        
    }
   
}

function stopPlaybackState() {
    if (playbackJob) {
        clearInterval(playbackJob);
        playbackJob = null;
        console.log('Spotify playback job stopped.');
    } else {
        console.log('Spotify playback job is not running.');
    }
}

module.exports = {schedulePlaybackState, stopPlaybackState}