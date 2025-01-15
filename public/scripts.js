import { drawActivityChart } from './d3.js';

let selectedButton = null;
let chartOptionalData = { "top-tracks": chartTopTracks, "top-artists": chartTopArtists, "top-albums": chartTopAlbums, null: null };


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('date-range-form');
    const chartContainerId = 'chart';

    const buttons = document.getElementById('date-range-top');

    if (typeof chartDataValues !== 'undefined') {
        drawActivityChart(chartDataValues, chartDataTime, null, 'chart');
    }

    window.addEventListener('resize', () => {
        clearChart(chartContainerId);
        drawActivityChart(
            chartDataValues,
            chartDataTime,
            chartOptionalData[selectedButton],
            chartContainerId
        );
    });


    form.addEventListener('change', (event) => {
        console.time("Querying calendar");
        if (event.target.name === 'dateRangeSet') {


            const dateRange = event.target.value;
            const currentDate = new Date().toISOString().split('T')[0];
            let startDate = currentDate;
            let endDate = startDate;

            let offset = 0;
            if (dateRange === "day") {
                offset = 0;
            } else if (dateRange === "week") {
                offset = 6;
            } else if (dateRange === "month") {
                offset = 30;
            } else if (dateRange === "sixMonth") {
                offset = 183;
            } else if (dateRange === "year") {
                offset = 365
            }

            const endDateObj = new Date(endDate);
            const startDateObj = new Date(endDateObj);
            startDateObj.setDate(endDateObj.getDate() - offset);
            startDate = startDateObj.toISOString().split('T')[0];
            endDateObj.setDate(endDateObj.getDate() + 1);
            endDate = endDateObj.toISOString().split('T')[0];

            setDateRange(true, dateRange, startDate, endDate);

        } else if (event.target.name === 'dateRangeCustom') {

            let startDate = document.getElementById('startDate').value
            let endDate = document.getElementById('endDate').value

            setDateRange(true, null, startDate, endDate);
        }

        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        const startDate = startDateInput.value
        const endDate = endDateInput.value

        fetch(`/songs/api/send-date-range`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ startDate, endDate }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {

                chartDataValues = data.chartDataValues;
                chartDataTime = data.chartDataTime;
                chartTopTracks = data.chartTopTracks;
                chartTopArtists = data.chartTopArtists;
                chartTopAlbums = data.chartTopAlbums;
                chartOptionalData = { "top-tracks": chartTopTracks, "top-artists": chartTopArtists, "top-albums": chartTopAlbums, null: null };


                document.getElementById('date-range-exact-values').innerHTML = `
                <div>
                    From <green-text>${data.startDate}</green-text> to <green-text>${data.endDate}</green-text>, <br>
                        I listened to <green-text> ${data.uniqueSongs} unique tracks </green-text> <br> on <green-text> ${data.uniqueAlbums} albums</green-text>, <br> from a total of <green-text> ${data.uniqueArtists}  artists</green-text>. <br>
                </div>
                <div>
                    This represents <green-text>${data.minutesListened} minutes </green-text> <br> and <green-text>${data.totalTracks} total tracks</green-text>.
                </div>


                `;


                let topTracksElement = "";
                data.topTracks.forEach((element, index) => {
                    topTracksElement += '<div class="ranking-item">'
                    topTracksElement += `
                    <div class="ranking-number" 
                        style="--ranking-color: ${data.colorList[index]}">
                        ${index + 1}.&nbsp;
                    </div>
                    <div class="ranking-name" style="--ranking-color: ${data.colorList[index]}">
                    <div class="ranking-title">
                    `;
                    if (element.name[0].length > 30) {
                        topTracksElement += `${element.name[0].substring(0, 30)}...`;
                    } else {
                        topTracksElement += `${element.name}`;
                    }
                    topTracksElement += `
                    </div>
                    <div class="ranking-artist">
                            ${element.artist[0][0]}
                        </div>
                    </div>
                    </div>
                    `;
                });
                document.getElementById('top-tracks').innerHTML = `
                    ${topTracksElement}
                `;

                let topArtistsElement = "";
                data.topArtists.forEach((element, index) => {
                    topArtistsElement += '<div class="ranking-item">'
                    topArtistsElement += `
                    <div class="ranking-number" 
                        style="--ranking-color: ${data.colorList[index]}">
                        ${index + 1}.&nbsp;
                    </div>
                    <div class="ranking-name" style="--ranking-color: ${data.colorList[index]}">
                    `;
                    if (element.name[0].length > 30) {
                        topArtistsElement += `${element.name[0].substring(0, 30)}...`;
                    } else {
                        topArtistsElement += `${element.name}`;
                    }
                    topArtistsElement += `
                    </div>
                    </div>
                    `;
                });
                document.getElementById('top-artists').innerHTML = `
                    ${topArtistsElement}
                `;

                let topAlbumsElement = "";
                data.topAlbums.forEach((element, index) => {
                    topAlbumsElement += '<div class="ranking-item">'
                    topAlbumsElement += `
                    <div class="ranking-number" 
                        style="--ranking-color: ${data.colorList[index]}">
                        ${index + 1}.&nbsp;
                    </div>
                    <div class="ranking-name" style="--ranking-color: ${data.colorList[index]}">
                    <div class="ranking-title">
                    `;
                    if (element.name[0].length > 30) {
                        topAlbumsElement += `${element.name[0].substring(0, 30)}...`;
                    } else {
                        topAlbumsElement += `${element.name}`;
                    }
                    topAlbumsElement += `
                    </div>
                    <div class="ranking-artist">
                            ${element.artist[0][0]}
                        </div>
                    </div>
                    </div>
                    `;
                });
                document.getElementById('top-albums').innerHTML = `
                    ${topAlbumsElement}
                `;

                clearChart(chartContainerId); // Clear the existing chart

                drawActivityChart(data.chartDataValues, data.chartDataTime, null, chartContainerId); // Draw the new chart


                const checkedButton = document.querySelector('input[name="dateRangeSet"]:checked');
                const selectedValue = checkedButton ? checkedButton.value : null;
                setDateRange(false, selectedValue, data.startDate, data.endDate)
                toggleButton(null);
                console.timeEnd("Querying calendar");
            })
            .catch((error) => {
                console.error('There was a problem with the fetch operation:', error);
            });
    })

    buttons.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {

            const buttonElement = event.target.closest('button');
            const normalizedId = buttonElement.id.replace('-button', '');

            toggleButton(normalizedId);

            clearChart(chartContainerId);
            drawActivityChart(chartDataValues, chartDataTime, chartOptionalData[selectedButton], chartContainerId);

        }
    })

});

function toggleButton(button) {
    const previousButton = document.getElementById(`${selectedButton}-button`);
    if (previousButton) {
        previousButton.classList.remove('selected');
    }

    if (selectedButton === button) {
        selectedButton = null;
    } else {
        selectedButton = button;
        const currentButton = document.getElementById(`${button}-button`);
        if (currentButton) {
            currentButton.classList.add('selected');
        }

    }

}

function setDateRange(isLoading, dateRange, startDate, endDate) {
    /* Function to modify the date range selector depending on specific inputs */
    let disabled = {}
    if (isLoading) {
        disabled = { "day": "disabled", "week": "disabled", "month": "disabled", "sixMonth": "disabled", "year": "disabled", "custom": "disabled" };
    } else {
        disabled = { "day": "", "week": "", "month": "", "sixMonth": "", "year": "", "custom": "" };
    }
    let checked = { "day": "", "week": "", "month": "", "sixMonth": "", "year": "" }
    if (dateRange) {
        checked[dateRange] = "checked"
        disabled[dateRange] = ""
    }

    document.getElementById('date-range-custom').innerHTML = `
        <label for="startDate">From </label>
        <input type="date" value="${startDate}" id="startDate" name="dateRangeCustom" ${disabled["custom"]}>
        <label for="endDate">to</label>
        <input type="date" value="${endDate}" id="endDate" name="dateRangeCustom" ${disabled["custom"]}>
    `;
    document.getElementById('date-range-set').innerHTML = `
        
        <input type="radio" name="dateRangeSet" id="day" value="day" ${checked["day"]} ${disabled["day"]}>
        <label for="day">D</label>

        <input type="radio" name="dateRangeSet" id="week" value="week" ${checked["week"]} ${disabled["week"]}>
        <label for="week"> W </label>

        <input type="radio" name="dateRangeSet" id="month" value="month" ${checked["month"]} ${disabled["month"]}>
        <label for="month">M</label>
        
        <input type="radio" name="dateRangeSet" id="sixMonth" value="sixMonth" ${checked["sixMonth"]} ${disabled["sixMonth"]}> 
        <label for="sixMonth">6M</label>
        
        
        <input type="radio" name="dateRangeSet" id="year" value="year" ${checked["year"]} ${disabled["year"]}>
        <label for="year">Y</label>
    `;

    document.getElementById("top-tracks-button").disabled = isLoading;
    document.getElementById("top-artists-button").disabled = isLoading;
    document.getElementById("top-albums-button").disabled = isLoading;


}

function clearChart(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}



async function updateCurrentSong() {
    try {

        const response = await fetch('api/current-song', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();


        const currentSongDiv = document.getElementById('current-song');

        if (data) {
            data = data.data.item;
            currentSongDiv.innerHTML = `
                <h4>Currently playing</h4>
                <a id="songs-display" href="https://open.spotify.com/track/${data.id}" target="_blank">
                    <img id="song-image" src="${data.album.images[0]?.url}" alt="Song Image">
                </a>
                <div>
                    <a id="songs-display" href="https://open.spotify.com/track/${data.id}" target="_blank">
                        ${data.name}
                    </a>
                </div>
                <div>
                    <a id="artists-display" href="https://open.spotify.com/artist/${data.artists[0].id}" target="_blank">
                        ${data.artists[0]?.name}
                    </a>
                </div>
            `;
        } else {
            currentSongDiv.innerHTML = `
                <h4>Currently playing</h4>
                <img id="song-image" src="../public/images/spotify-nothing-playing.png" alt="Song Image">
                <a id="songs-display" href="https://open.spotify.com/" target="_blank">Not listening to music :(</a>
            `;
        }
    } catch (error) {
        console.error('Error fetching current song:', error);
    }
}

setInterval(updateCurrentSong, 10000);
updateCurrentSong();
