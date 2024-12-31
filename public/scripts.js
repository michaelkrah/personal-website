import { drawActivityChart } from './d3.js';

let selectedButton = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('date-range-form');
    const chartContainerId = 'chart';

    const buttons = document.getElementById('date-range-top');

    if (typeof chartDataValues !== 'undefined') {
        drawActivityChart(chartDataValues, chartDataTime, null, 'chart');
    }

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


                document.getElementById('date-range-exact-values').innerHTML = `
                    <ul>
                        Listened for ${data.minutesListened} minutes
                    </ul>
                    <ul>
                    Listened to ${data.uniqueArtists} unique artists
                    </ul>
                    <ul>
                    Listened to ${data.uniqueSongs} unique tracks
                    </ul>
                `;


                let topTracksElement = "";
                data.topTracks.forEach((element, index) => {
                    topTracksElement += `${index + 1}. ${element.name} <br>`;
                });
                document.getElementById('top-tracks').innerHTML = `
                    ${topTracksElement}
                `;

                let topArtistsElement = "";
                data.topArtists.forEach((element, index) => {
                    topArtistsElement += `${index + 1}. ${element.name} <br>`;
                });
                document.getElementById('top-artists').innerHTML = `
                    ${topArtistsElement}
                `;

                clearChart(chartContainerId); // Clear the existing chart

                drawActivityChart(data.chartDataValues, data.chartDataTime, null, chartContainerId); // Draw the new chart


                const checkedButton = document.querySelector('input[name="dateRangeSet"]:checked');
                const selectedValue = checkedButton ? checkedButton.value : null;
                setDateRange(false, selectedValue, data.startDate, data.endDate)
                console.timeEnd("Querying calendar");
            })
            .catch((error) => {
                console.error('There was a problem with the fetch operation:', error);
            });
    })

    buttons.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
            toggleButton(event.target.id);


            let chartOptionalData = { "top-tracks": chartTopTracks, "top-artists": chartTopArtists, null: null };
            clearChart(chartContainerId);
            drawActivityChart(chartDataValues, chartDataTime, chartOptionalData[selectedButton], chartContainerId);

        }
    })

});

function toggleButton(button) {
    if (selectedButton === button) {
        selectedButton = null;
    } else {
        selectedButton = button;
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


}

function clearChart(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}
