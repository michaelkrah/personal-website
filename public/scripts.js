import { drawActivityChart } from './d3.js';


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('date-range-form');
    const chartContainerId = 'chart';

    if (typeof chartDataValues !== 'undefined') {
        drawActivityChart(chartDataValues, chartDataTime, 'chart');
    }


    form.addEventListener('change', (event) => {
        if (event.target.name === 'dateRange') {
            const dateRange = event.target.value;
            const currentDate = new Date().toISOString().split('T')[0];
            // console.log(currentDate);
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
                offset = 182;
            } else if (dateRange === "year") {
                offset = 365
            }

            const endDateObj = new Date(endDate);
            const startDateObj = new Date(endDateObj);
            startDateObj.setDate(endDateObj.getDate() - offset);
            startDate = startDateObj.toISOString().split('T')[0];
            endDateObj.setDate(endDateObj.getDate() + 1);
            endDate = endDateObj.toISOString().split('T')[0];

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
                    `;



                    clearChart(chartContainerId); // Clear the existing chart

                    drawActivityChart(data.chartDataValues, data.chartDataTime, chartContainerId); // Draw the new chart

                })
                .catch((error) => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        }
    });
});


function clearChart(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = ''; // Remove all child elements
    }
}
