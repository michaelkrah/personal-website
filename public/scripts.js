let topAttributes = [];
let attributeColorClasses = []
let currentCalendarResponse = null;
$(document).ready(function() {
    // Calculate today's date
    const today = new Date();
    const formattedToday = today.toISOString().slice(0, 10); // Formats date to "YYYY-MM-DD"

    // Calculate the date one week ago
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);
    const formattedOneWeekAgo = oneWeekAgo.toISOString().slice(0, 10);

    // const today = new Date("2022-10-16");
    // const oneWeekAgo = new Date("2022-10-9");
    // const formattedToday = today.toISOString().slice(0, 10); // Formats date to "YYYY-MM-DD"
    // const formattedOneWeekAgo = oneWeekAgo.toISOString().slice(0, 10);
    // Set the default values
    $('#startDate').val(formattedOneWeekAgo);
    $('#endDate').val(formattedToday);

    $('#fetchData').click(function() {
        const startDate = $('#startDate').val();
        const endDate =  $('#endDate').val();
        $.ajax({
            
            url: `/songs/api/get-data-from-interval?start=${startDate}&end=${endDate}`,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                currentCalendarResponse = response;
                // Use the received data to update the calendar
                updateCalendar(response);
            },
            error: function(error) {
                console.error("Error fetching data:", error);
            }
        });
    });
    $('#fetchData').click();

    $("[name='customRadio']").change(function() {
        let selectedValue = $(this).val();
        const startDate = $('#startDate').val();
        const endDate =  $('#endDate').val();
        
        // Perform an action based on the radio button selected
        switch(parseInt(selectedValue)) {
            case 1:
                console.log("Button 1 selected");
                updateCalendar(currentCalendarResponse);
                break;
            case 2:
                console.log("Button 2 selected");
                getTop(startDate, endDate, "song")
                break;
            case 3:
                console.log("Button 3 selected");
                getTop(startDate, endDate, "artist")
                break;
            case 4:
                console.log("Button 4 selected");
                getTop(startDate, endDate, "album")
                break;
            case 5:
                console.log("Button 5 selected");
                getTop(startDate, endDate, "genre")
                break;
        }
    });
    const startDate = $('#startDate').val();
    const endDate =  $('#endDate').val();
    getTop(startDate, endDate, "song")

});



function updateCalendar(response) {
    const grid = $(".grid");
    grid.empty();
    grid.css("grid-template-columns", `repeat(${response.numDays}, 1fr)`);
    const gridWidth = grid.width();
    response._data.forEach(item => {
        const dayDiv = $('<div class="day"></div>');
        if (Math.floor(gridWidth / response.numDays) < 40) {
            $('<span></span>').text("").appendTo(dayDiv);
        } else {
            
            const days = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
    
            const date = new Date(item.day);
            let weekDay = days[date.getDay()];
            $('<span></span>').text(weekDay).appendTo(dayDiv);
        }
        
        item.segments.forEach(segment => {
            const segmentDiv = $('<div class="segment"></div>');
            // Based on your structure, segment[1] contains the track or event data
            if (segment[1] !== null) {
                segmentDiv.addClass('active');
            }
            dayDiv.append(segmentDiv);
        });

        grid.append(dayDiv);
    });

    // Update the grid-template-columns based on the number of days
    grid.css("grid-template-columns", `repeat(${response.numDays}, 1fr)`);
}

function getTop(startDate, endDate, attribute) {
    $.ajax({
            
        url: `/songs/api/get-top-from-interval?start=${startDate}&end=${endDate}&attribute=${attribute}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            // Use the received data to update the calendar
            updateTopAttributes(response);
        },
        error: function(error) {
            console.error("Error fetching data:", error);
        }
    });
}

function updateCalendarAttributes(response) {
    const grid = $(".grid");
    grid.empty();
    grid.css("grid-template-columns", `repeat(${response.numDays}, 1fr)`);
    const gridWidth = grid.width();
    response._data.forEach(item => {
        const dayDiv = $('<div class="day"></div>');
        if (Math.floor(gridWidth / response.numDays) < 40) {
            $('<span></span>').text("").appendTo(dayDiv);
        } else {
            
            const days = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
    
            const date = new Date(item.day);
            let weekDay = days[date.getDay()];
            $('<span></span>').text(weekDay).appendTo(dayDiv);
        }
        
        item.segments.forEach(segment => {
            const segmentDiv = $('<div class="segment"></div>');
            // Based on your structure, segment[1] contains the track or event data
            
            if ($('input[name="customRadio"]:checked').val() == "1" && segment[1] !== null) {
                segmentDiv.addClass('active');
            } else if ($('input[name="customRadio"]:checked').val() == "2" && segment[1] !== null && topAttributes.includes(segment[1].trackTitle)) {
                segmentDiv.addClass(attributeColorClasses[segment[1].trackTitle]);

            } else if ($('input[name="customRadio"]:checked').val() == "3" && segment[1] !== null && topAttributes.includes(segment[1].trackArtist)) {
                segmentDiv.addClass(attributeColorClasses[segment[1].trackArtist]);

            } else if ($('input[name="customRadio"]:checked').val() == "4" && segment[1] !== null && segment[1].trackAlbum !== null && topAttributes.includes(segment[1].trackAlbum)) {
                segmentDiv.addClass(attributeColorClasses[segment[1].trackAlbum]);

            } else if ($('input[name="customRadio"]:checked').val() == "5" && segment[1] !== null && segment[1].genres !== null && segment[1].genres.some(genre => topAttributes.includes(genre))) {
                let numGenre = 0
                for (i = 0; i < segment[1].genres; i++) {
                    if (topAttributes.includes(segment[1].genres[i])) {
                        numGenre = i;
                        break;
                    }
                }
                segmentDiv.addClass(attributeColorClasses[segment[1].genres[numGenre]]);
            } else if (segment[1] !== null) {
                segmentDiv.addClass('other');
            }
            dayDiv.append(segmentDiv);
        });

        grid.append(dayDiv);
    });

    // Update the grid-template-columns based on the number of days
    grid.css("grid-template-columns", `repeat(${response.numDays}, 1fr)`);
}

function updateTopAttributes(response) {
    topAttributes = [];
    attributeColorClasses = [];


    topAttributes = response.map(item => item.trackAttribute[0]);
    console.log(topAttributes)
    for (let i = 0; i < topAttributes.length; i++) {
        attributeColorClasses[topAttributes[i]] = `color-class-${i + 1}`;
    }
    console.log(attributeColorClasses)
    console.log("here")
    console.log(response[0])
    for (let i = 0; i < response.length; i++) {
        let trackAttribute = response[i].trackAttribute[0]; // Get the first trackAttribute
        $("#middle" + (i + 1)).text(trackAttribute); // Update the corresponding middle div
    }
    if (currentCalendarResponse.numDays < 14) {
        updateCalendarAttributes(currentCalendarResponse);
    }
    
};

function updateSong() {
    console.log("getting current song")
    $.ajax({
        url: `/songs/api/get-current-song`,
        method: 'GET',
        success: function(data) {
            if (data.trackTitle.charAt(0) === "_") {
                $('#songDisplay').html("Not listening to music :(");
                $('#songArtist').html("");
                $("#songImage").attr("src", "");
            } else {
                $('#songDisplay').html(data.trackTitle);
                const songUrl = `https://open.spotify.com/track/${data.trackID}`; // Replace with your actual path and pattern
                $('#songDisplay').attr('href', songUrl);
                $('#songArtist').html(data.trackArtist);
                const artistUrl = `https://open.spotify.com/artist/${data.artistID}`; // Replace with your actual path and pattern
                $('#songArtist').attr('href', artistUrl);
                $("#songImage").attr("src", data.albumImage);
            }
            
            setTimeout(updateSong, 5000);  // Update every 5 seconds
        }
    });
}

updateSong();


