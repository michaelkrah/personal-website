const moment = require('moment-timezone');
const { getLastListened } = require('../config/spotifyConfig');
const { getTracksFromInterval, getTopFromInterval } = require('../services/trackService');
const { getListensFromInterval } = require('../services/playbackService');

const { client } = require('../config/dbConfig');
const Track = require('../models/track');


async function getAnalysisFromRange(startDate, endDate) {

  const tracks = await getTracksFromInterval(startDate, endDate);

  const topTracks = await getTopFromInterval(startDate, endDate, "tracks");
  const topArtists = await getTopFromInterval(startDate, endDate, "artists");


  const uniqueTracks = new Set(tracks.map(track => track.data.item.id));
  const uniqueArtists = new Set(tracks.map(track => track.data.item.artists[0]?.id).filter(Boolean));

  const currentSong = getLastListened()?.data?.item || null

  const startDateObj = new Date(`${startDate}T00:00:00Z`);
  const endDateObj = new Date(`${endDate}T00:00:00Z`);
  let dateTracker = new Date(startDateObj);
  let endDateTracker = new Date(endDateObj);
  let datesListString = []
  let chartData = []
  while (dateTracker.getTime() < endDateTracker.getTime()) {
    const dateString = dateTracker.toISOString().split('T')[0];
    datesListString.push(dateTracker.toISOString().split('T')[0]);
    dateTracker.setDate(dateTracker.getDate() + 1);
  }

  // Object that represents a period of listening to music, includes a date and a start and end time
  minutesListened = 0;
  let listeningBlock = { day: null, start: null, end: null };
  for (let track in tracks) {
    let listenDate = new Date(tracks[track].listenTime);
    let listenTime = tracks[track].listens.length
    let hour = listenDate.getHours();
    let minutes = listenDate.getMinutes();
    let seconds = listenDate.getSeconds();

    let start = hour + (((minutes * 60) + seconds) / 3600)
    let end = hour + (((minutes * 60) + seconds + (30 * (listenTime + 2))) / 3600)

    listenDate = new Date(tracks[track].listenTime - 18000000); // lazy way to convert date to est consistently
    const dateKey = listenDate.toISOString().split('T')[0];

    minutesListened += listenTime;

    if (Number(track) === 0) {
      // base case, first object encountered
      listeningBlock = { day: dateKey, start: start, end: end };
      continue;
    }
    // If the current track is from a different day or occurs more than 2 minutes after the previous track, Math.abs() fixes an edgecase where the time loops around 
    // start a new rectangle block for visualiation

    if (dateKey != listeningBlock.day || Math.abs(start - listeningBlock.end) > 1 / 30) {
      chartData.push(listeningBlock);
      listeningBlock = { day: dateKey, start: start, end: end };

    } else {
      listeningBlock.end = end;
    }
  };
  chartData.push(listeningBlock);
  console.log(chartData);
  console.log(datesListString);
  return {
    startDate: startDate,
    endDate: endDate,
    currentSong: currentSong,
    topTracks: topTracks,
    topArtists: topArtists,
    uniqueSongs: uniqueTracks.size,
    uniqueArtists: uniqueArtists.size,
    minutesListened: Math.ceil(minutesListened * 0.5),
    chartDataTime: datesListString,
    chartDataValues: chartData,
  }
};

module.exports = {
  getLastListened,
  getAnalysisFromRange,
};
