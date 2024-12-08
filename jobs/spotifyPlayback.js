const {getRequestPlayer} = require('../config/spotifyConfig');
const {requestPlaybackState} = require('../services/playbackService')

let playbackJob = null;

async function schedulePlaybackState() {
    if (!playbackJob) {
        playbackJob = true;
        const executeJob = async () => {
            try {
                if (!getRequestPlayer()) {
                    playbackJob = null; 
                    return;
                }

                await requestPlaybackState(); 
            } catch (error) {
                console.error('Error during Spotify playback check:', error);
            }

            if (playbackJob) {
                setTimeout(executeJob, 30000); 
            }
        };

        executeJob();
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