const moment = require('moment-timezone');
const {getLastListened} = require('../config/spotifyConfig');
const { getTracksFromInterval, getTopFromInterval } = require('../services/trackService');
const { getListensFromInterval } = require('../services/playbackService');

const { client } = require('../config/dbConfig');
const Track = require('../models/track');


async function getAnalysisFromRange(startDate, endDate) {
  const listens = await getListensFromInterval(startDate, endDate);
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



  for (listen in listens) {
    let listenDate = new Date(listens[listen].listenTime);
    const dateKey = listenDate.toISOString().split('T')[0]; 
    let hour = listenDate.getHours(); 
    let minutes = listenDate.getMinutes(); 
    let seconds = listenDate.getSeconds(); 

    let start = hour + (((minutes * 60) + seconds) / 3600)
    let end = hour + (((minutes * 60) + seconds + 90) / 3600)


    chartData.push({day: dateKey, start: start, end:  end})

  };



  return {startDate: startDate,
    endDate: endDate,
    currentSong: currentSong,
    topTracks: topTracks,
    topArtists: topArtists,
    uniqueSongs: uniqueTracks.size,
    uniqueArtists: uniqueArtists.size,
    minutesListened: Math.ceil(listens.length * 0.5),
    chartDataTime: datesListString,
    chartDataValues: chartData,
  }
};

module.exports = {
  getLastListened,
  getAnalysisFromRange,
};
