function zeroPad(n, p, c) {
    var pad_char = typeof c !== 'undefined' ? c : '0';
    var pad = new Array(1 + p).join(pad_char);
    return (pad + n).slice(-pad.length);
}
function prettyTime(floatSeconds) {
    var outStr = '';
    var hours = Math.floor(floatSeconds / 3600);
    floatSeconds -= hours * 3600;

    var minutes = Math.floor(floatSeconds / 60);
    floatSeconds -= minutes * 60;
    if (hours > 0) {
        outStr += hours + ':' + zeroPad(minutes, 2) + ':';
    } else {
        outStr += minutes + ':';
    }

    //var seconds = parseInt(floatSeconds % 60, 10);
    outStr += zeroPad(Math.round(floatSeconds), 2);
    return outStr;
}
function updateRdioVR() {
    // console.log("updating info...");
    if (R.player.playState() == 0) {
        d3.select("#toggle-pause").html('<i class="fa fa-play"></i>');
    } else {
        d3.select("#toggle-pause").html('<i class="fa fa-pause"></i>');
    }
    d3.select("#currentTime").html(prettyTime(R.player.position()));
    d3.select("#totalTime").html(prettyTime(R.player.playingTrack().get("duration")));
    d3.select("#currentArtist").html(R.player.playingTrack().get("artist"));
    d3.select("#currentTT").html(R.player.playingTrack().get("name"));
    d3.select("#currentAlbum").html(R.player.playingTrack().get("album"));
    d3.select("#currentArtwork").attr("src", R.player.playingTrack().get("icon"));
}
function mostSquareImage(imageList) {
    var smallestOffset = 5.0;
    var bestIndex = 0;
    for (var i = 0; i < imageList.length; i++) {
        if ("aspect_ratio" in imageList[i]) {
            var aspectOffset = Math.abs(1.0 - imageList[i].aspect_ratio);
            if (aspectOffset < smallestOffset) {
                smallestOffset = aspectOffset;
                bestIndex = i;
            }
        }
    }
    return imageList[bestIndex].url;
}
function playOther(rdioid, buttonNum) {
    var oldid = d3.select("#currentRdioID").html();
    var oldtitle = d3.select("#currentTT").html();
    R.player.play({source: rdioid});
    d3.select("#currentRdioID").html(rdioid);
    d3.select("#otherTrack" + buttonNum).text(oldtitle);
    d3.select("#otherTrack" + buttonNum).attr("onClick", 'playOther("' + oldid + '", ' + buttonNum + ')');
}
function updatePageForArtist(artistID, artistName) {
    d3.select("#artistName").html(artistName);
    imageURL = "http://developer.echonest.com/api/v4/artist/images?api_key=7O9SCISYFF6XFQQJC&format=json&results=25&license=cc-by-sa&start=0&id=";
    imageURL += artistID;
    console.log(imageURL);
    d3.json(imageURL, function(error, json) {
        if (error) return console.warn(error);
        var bestImageUrl = mostSquareImage(json.response.images);
        d3.select("#artistImage").attr("src", bestImageUrl);
    });
    var bioURL = "http://developer.echonest.com/api/v4/artist/biographies?api_key=7O9SCISYFF6XFQQJC&format=json&results=1&start=0&license=cc-by-sa&id=";
    bioURL += artistID;
    d3.json(bioURL, function(error, json) {
        if (error) return console.warn(error);
        var paragraphs = json.response.biographies[0].text.split(/\s\s+/);
        // d3.select("#artistBio").html(json.response.biographies[0].text);
        d3.select("#artistBio").html("");
        for (var i = 0; i < paragraphs.length; i++) {
            d3.select("#artistBio").append("p").text(paragraphs[i]);
        }
        // console.log(json.response.biographies[0].text);
    });
    var similarURL = "http://developer.echonest.com/api/v4/artist/similar?api_key=7O9SCISYFF6XFQQJC&format=json&results=5&start=0&id=";
    similarURL += artistID;
    console.log(similarURL)
    d3.json(similarURL, function(error, json) {
        if (error) return console.warn(error);
        for (var i = 0; i < json.response.artists.length; i++) {
            d3.select("#similarArtist" + i).text(json.response.artists[i].name);
            var aid = json.response.artists[i].id;
            var aname = json.response.artists[i].name;
            d3.select("#similarArtist" + i).attr("onClick", 'updatePageForArtist("' + aid + '", "' + aname + '")');
        }
    });
    var songsURL = "http://developer.echonest.com/api/v4/song/search?api_key=7O9SCISYFF6XFQQJC&sort=song_hotttnesss-desc&results=25&bucket=id:rdio-US&bucket=tracks&limit=true&artist_id=";
    songsURL += artistID;
    console.log(songsURL);
    d3.select("#otherTracksArtist").html(artistName);
    d3.select("#similarArtistsArtist").html(artistName);
    d3.select("#recSection").style("visibility", "visible");
    d3.json(songsURL, function(error, json) {
        if (error) return console.warn(error);
        var uniqueTitles = [json.response.songs[0].title];
        var rdioSongIDFull = json.response.songs[0].tracks[0].foreign_id;
        var rdioSongID = rdioSongIDFull.substring(rdioSongIDFull.lastIndexOf(":") + 1);
        console.log("playing rdio track: " + rdioSongID);
        R.player.play({source: rdioSongID});
        d3.select("#currentRdioID").html(rdioSongID);
        d3.select("#playerInfo").style("visibility", "visible");

        var otherSongTitle;
        var otherNum = 1;
        for (var i = 1; i < json.response.songs.length && otherNum < 6; i++) {
            otherSongTitle = json.response.songs[i].title;
            if (uniqueTitles.indexOf(otherSongTitle) < 0) {
                rdioSongIDFull = json.response.songs[i].tracks[0].foreign_id;
                rdioSongID = rdioSongIDFull.substring(rdioSongIDFull.lastIndexOf(":") + 1);
                d3.select("#otherTrack" + otherNum).text(otherSongTitle);
                d3.select("#otherTrack" + otherNum).attr("onClick", 'playOther("' + rdioSongID + '", ' + otherNum + ')');
                uniqueTitles.push(otherSongTitle);
                otherNum++;
            }
        }
    });
    d3.select("#bioSection").style("visibility", "visible");
}
function searchEchoNest(searchStr) {
    console.log('searching for: ' + searchStr);
    var searchURL = "http://developer.echonest.com/api/v4/artist/search?api_key=7O9SCISYFF6XFQQJC&format=json&results=1&sort=familiarity-desc&name=";
    searchURL += encodeURI(searchStr);
    console.log(searchURL);
    d3.json(searchURL, function(error, json) {
        if (error) return console.warn(error);
        if (json.response.artists.length > 0){
            // console.log(json.response.artists[0].name);
            // var theArtistName = json.response.artists[0].name;
            updatePageForArtist(json.response.artists[0].id, json.response.artists[0].name);
        }
        
    });
}
function searchTextBoxContents() {
    var textToSearch = d3.select("#textInput").property("value");
    searchEchoNest(textToSearch);
}
function randomArtist() {
    var randURL = "http://developer.echonest.com/api/v4/artist/search?api_key=7O9SCISYFF6XFQQJC&format=json&results=99&sort=familiarity-desc";
    d3.json(randURL, function(error, json) {
        var randInt = Math.floor((Math.random() * 99));
        var bandName = json.response.artists[randInt].name;
        // d3.select("#speechTranscript").html(bandName);
        searchEchoNest(bandName);
    });
}