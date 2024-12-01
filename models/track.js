class Track {
  constructor(data) {
    this.trackTitle = "_unknown";
    this.trackType = "_unknown";
    this.trackArtist = "_unknown";
    this.artistID = "_unknown";
    this.trackAlbum = "_unknown";
    this.trackID = "_unknown";
    this.albumImage = "_unknown";
    this.releaseDate = "____-__";
    this.genres = [];
    this.trackDuration = null;
    this.startDate = new Date();
    this.endDate = this.startDate;
    this.startTime = new Date().getTime();
    this.endTime = this.startTime;
    this.data = data;
  }

  toString() {
    return `${this.trackTitle} by ${this.trackArtist}`;
  }
}

module.exports = Track;
