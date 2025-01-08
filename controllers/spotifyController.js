const moment = require('moment-timezone');
const { getLastListened } = require('../config/spotifyConfig');
const { getTracksFromInterval, getTopFromInterval } = require('../services/trackService');
const { getListensFromInterval } = require('../services/playbackService');

const { client } = require('../config/dbConfig');


async function getAnalysisFromRange(startDate, endDate) {

  const tracks = await getTracksFromInterval(startDate, endDate);

  // CHANGE, ok for now as a lazy proof of concept, optimize in the future
  // can try just querying separately, might be faster 
  // alternatively can do this as an async call, send data when it's received, might be ideal but would require sig restructing 

  const topTracks = await getTopFromInterval(startDate, endDate, "tracks");
  const topArtists = await getTopFromInterval(startDate, endDate, "artists");
  const topAlbums = await getTopFromInterval(startDate, endDate, "albums")

  const uniqueTracks = new Set(tracks.map(track => track.data.item.id));
  const uniqueArtists = new Set(tracks.map(track => track.data.item.artists[0]?.id).filter(Boolean));
  const uniqueAlbums = new Set(tracks.map(track => track.data.item.album.id));

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

  // Object that represents a period of listening to music, includes a date and a start and end time, entry used for coloring, 0 is default
  minutesListened = 0;
  let listeningBlock = { entry: 0, day: null, start: null, end: null };
  for (let track in tracks) {
    let listenDate = new Date(tracks[track].listenTime);
    let listenTime = tracks[track].listens.length;
    let hour = listenDate.getHours();
    let minutes = listenDate.getMinutes();
    let seconds = listenDate.getSeconds();

    let start = hour + (((minutes * 60) + seconds) / 3600)
    let end = hour + (((minutes * 60) + seconds + (30 * (listenTime + 2))) / 3600) // listenTime + 2 creates a minute long buffer for listening blocks

    listenDate = new Date(tracks[track].listenTime - 18000000); // lazy way to convert date to est consistently
    const dateKey = listenDate.toISOString().split('T')[0];

    minutesListened += listenTime;


    if (Number(track) === 0) {
      // base case, first object encountered
      listeningBlock = { entry: 0, day: dateKey, start: start, end: end };
      continue;
    }
    // If the current track is from a different day or occurs more than 2 minutes after the previous track, Math.abs() fixes an edgecase where the time loops around 
    // start a new rectangle block for visualiation

    if (dateKey != listeningBlock.day || start - listeningBlock.end > 1 / 30 || Math.abs(start - listeningBlock.end) > 1) {
      chartData.push(listeningBlock);
      listeningBlock = { entry: 0, day: dateKey, start: start, end: end };
    } else {
      listeningBlock.end = end;
    }
  };
  chartData.push(listeningBlock);

  // create lists to hold the top tracks, artists, etc. to recolor the chart as necessary

  const chartTopTracks = chartDataConversion(topTracks);
  const chartTopArtists = chartDataConversion(topArtists);
  const chartTopAlbums = chartDataConversion(topAlbums);
  return {
    startDate: startDate,
    endDate: endDate,
    currentSong: currentSong,
    topTracks: topTracks,
    topArtists: topArtists,
    topAlbums: topAlbums,
    totalTracks: tracks.length,
    uniqueSongs: uniqueTracks.size,
    uniqueArtists: uniqueArtists.size,
    uniqueAlbums: uniqueAlbums.size,
    minutesListened: Math.ceil(minutesListened * 0.5),
    chartDataTime: datesListString,
    chartDataValues: chartData,
    chartTopTracks: chartTopTracks,
    chartTopArtists: chartTopArtists,
    chartTopAlbums: chartTopAlbums,
    colorList: ["#DAA520", "#87CEFA", "#C71010", "#EA87FA", "#6B8E23"]
  }
};

function chartDataConversion(topList) {
  let chartTopData = [];
  for (let object in topList) {
    let entries = topList[object].entries;
    for (let entry in entries) {

      let listenDate = new Date(entries[entry].listenTime);
      let listenTime = entries[entry].listens.length
      let hour = listenDate.getHours();
      let minutes = listenDate.getMinutes();
      let seconds = listenDate.getSeconds();

      let start = hour + (((minutes * 60) + seconds) / 3600)
      let end = hour + (((minutes * 60) + seconds + (30 * (listenTime))) / 3600)

      listenDate = new Date(entries[entry].listenTime - 18000000);
      const dateKey = listenDate.toISOString().split('T')[0];

      // entries labeled from 1 to x + 1, 0 is the default
      listeningBlock = { entry: Number(object) + 1, day: dateKey, start: start, end: end };

      chartTopData.push(listeningBlock)
    }
  }

  return chartTopData;
}

module.exports = {
  getLastListened,
  getAnalysisFromRange,
};
