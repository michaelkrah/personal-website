import { drawActivityChart } from './d3.js';


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('date-range-form');
    const chartContainerId = 'chart';


    if (typeof chartDataValues !== 'undefined') {
        drawActivityChart(chartDataValues, chartDataTime, null, 'chart');
    }


    form.addEventListener('change', (event) => {
        console.time("Querying calendar");
        if (event.target.name === 'dateRangeSet') {


            const dateRange = event.target.value;
            // const currentDate = new Date().toISOString().split('T')[0];
            const currentDate = "2024-12-03"
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
            console.log("dateRangeCustom pressed")
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
                document.getElementById('date-range-test').innerHTML = `
                    <h2>Filtered Songs</h2>
                    <ul>
                        From ${data.startDate} to ${data.endDate} 
                    </ul>
                    <ul>
                        Listened for ${data.minutesListened} minutes
                    </ul>
                    <ul>
                    Listened to ${data.uniqueArtists} unique artists
                    </ul>
                    <ul>
                    Listened to ${data.uniqueSongs} unique songs
                    </ul>
                    <h2>Ranking</h2>
                    <ul id="top-tracks"></ul>
                    <ul id="top-artists"></ul>
                `;

                const topTracksElement = document.getElementById('top-tracks');
                data.topTracks.forEach((element, index) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${index + 1}. ${element.name}`;
                    topTracksElement.appendChild(listItem);
                });

                const topArtistsElement = document.getElementById('top-artists');
                data.topArtists.forEach((element, index) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${index + 1}. ${element.name}`;
                    topArtistsElement.appendChild(listItem);
                });

                clearChart(chartContainerId); // Clear the existing chart

                drawActivityChart(data.chartDataValues, data.chartDataTime, data.chartTopArtists, chartContainerId); // Draw the new chart

                const checkedButton = document.querySelector('input[name="dateRangeSet"]:checked');
                const selectedValue = checkedButton ? checkedButton.value : null;
                setDateRange(false, selectedValue, data.startDate, data.endDate)
                console.timeEnd("Querying calendar");
            })
            .catch((error) => {
                console.error('There was a problem with the fetch operation:', error);
            });
    })
});

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
        <label for="startDate">Start Date:</label>
        <input type="date" value="${startDate}" id="startDate" name="dateRangeCustom" ${disabled["custom"]}>
        <label for="endDate">End Date:</label>
        <input type="date" value="${endDate}" id="endDate" name="dateRangeCustom" ${disabled["custom"]}>
    `;
    document.getElementById('date-range-set').innerHTML = `
        <label>
            <input type="radio" name="dateRangeSet" value="day" ${checked["day"]} ${disabled["day"]}> D
        </label>
        <label>
            <input type="radio" name="dateRangeSet" value="week" ${checked["week"]} ${disabled["week"]}> W
        </label>
        <label>
            <input type="radio" name="dateRangeSet" value="month" ${checked["month"]} ${disabled["month"]}> M
        </label>
        <label>
            <input type="radio" name="dateRangeSet" value="sixMonth" ${checked["sixMonth"]} ${disabled["sixMonth"]}> 6M
        </label>
        <label>
            <input type="radio" name="dateRangeSet" value="year" ${checked["year"]} ${disabled["year"]}> Y
        </label>
    `;
}

function clearChart(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = ''; // Remove all child elements
    }
}
