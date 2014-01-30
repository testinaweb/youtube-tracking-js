// this code has been emplemented to track all iframe youtube videos in a page.
// inspiration code:
// https://developers.google.com/youtube/youtube_player_demo
// http://www.lunametrics.com/blog/2012/10/22/automatically-track-youtube-videos-events-google-analytics/
 
// Internet Explorer compatibility

// console.log hack
if (typeof console == 'undefined') {
	window.console = {
		log: function (s){alert(s);} 
	}
}

// indexOf for IE 8
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(what, i) {
        i = i || 0;
        var L = this.length;
        while (i < L) {
            if(this[i] === what) return i;
            ++i;
        }
        return -1;
    };
}

// function to remove a value from an array: removeA(array, value [, value[, ...]])
function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

// async youtube iframe_api
var tag = document.createElement('script');
tag.src = "http://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// init of variables
var videoArray = new Array();
var playerArray = new Array();
var titleArray = new Array();
var pauseFlag = new Array();
var percentageScore = new Array();

// percentage score to track i.e. 25%, 50%, 75%
var trackingScore = new Array(25, 50, 75);

// trackYouTube get all iframe and initialize the variable for the tracking
(function($) {
	function trackYouTube()
	{
		var i = 0;

		// browse the iframes in the page
		$('iframe').each(function() {
			if($(this).attr('src')===undefined){
				var vidSrc = "";
			}else{
				var vidSrc = $(this).attr('src');
			}

			// regex to recognize if the iframae is an youtube iframe
			var regex = /h?t?t?p?s?\:?\/\/www\.youtube\.com\/embed\/([\w-]{11})(?:\?.*)?/;
			var matches = vidSrc.match(regex);
			if(matches && matches.length > 1){
				// array of youtube video ids
				videoArray[i] = matches[1];

				// get the title for tracking otherwise i use the youtube video id
				titleArray[matches[1]] = matches[1];
				var msie = false;
				var callAjaxUrl = 'https://www.googleapis.com/youtube/v3/videos?id='+matches[1]+'&key=AIzaSyDmo65pRSWLcnFqpQ4XjeA-jeBfdNAU0Bg&fields=items(id,snippet(title))&part=snippet'
				if (navigator.userAgent.toLowerCase().indexOf('msie') > -1) {
					callAjaxUrl = 'http://gdata.youtube.com/feeds/api/videos/'+matches[1]+'?v=2&alt=json';
					msie = true;
				}
				$.support.cors = true;
				$.ajax({
					type: 'GET',
					url: callAjaxUrl,
					dataType: 'json',
					crossDomain: true,
					success: function(json){
						titleArray[matches[1]] = (msie ? json['entry']['title']['$t'] : json['items'][0]['snippet']['title']);
					}
					//error: function(xhr, status, error){
					//	alert(error);
					//}
				});

				// init default values for every videos 
				pauseFlag[matches[1]] = false;
				percentageScore[matches[1]] = trackingScore.slice(0);

				// write the id in each iframe
				$(this).attr('id', matches[1]);

				i++;
			}
		});	
	}

	// initalize the tracking
	$(document).ready(function() {
		trackYouTube();
	});
})(jQuery);

//When the API of YouTube doth load, it will call as if by magic this function or code.
function onYouTubeIframeAPIReady() {
	// initalize each iframe video
	for (var i = 0; i < videoArray.length; i++) {
		playerArray[i] = new YT.Player(videoArray[i], {
			events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
			}
		});		
	}
}

// hack for Opera
if(navigator.userAgent.toLowerCase().indexOf('opera') > -1){
    addEventListener('load', onYouTubeIframeAPIReady, false);
}

// when the videos are ready, it starts the tracking for the percentage
function onPlayerReady(event) {
	
	// this function runs every 600 milliseconds
	setInterval(function(){
		var percentage = Math.round(event.target.getCurrentTime()*100/Math.round(event.target.getDuration()));
		if (percentageScore[event.target.getVideoData().video_id].indexOf(percentage) > -1) {
			console.log(titleArray[event.target.getVideoData().video_id]+' - '+percentage);
			removeA(percentageScore[event.target.getVideoData().video_id], percentage);
		}

	}, 600);
	//console.log(event+' onPlayerReady ');
}

function onPlayerStateChange(event) { 
	// gets the video id to track the right one
	videoarraynum = event.target.getVideoData().video_id;

	// when the video is played
	if (event.data ==YT.PlayerState.PLAYING){
		console.log('Videos PLAY '+titleArray[videoarraynum]);
		//_gaq.push(['_trackEvent', 'Videos', 'Play', videoArray[videoarraynum] ]); 

		pauseFlag[videoarraynum] = false;
	} 
	
	// when the video is ended
	if (event.data ==YT.PlayerState.ENDED){
		console.log('Videos Watch to End '+titleArray[videoarraynum]);
		//_gaq.push(['_trackEvent', 'Videos', 'Watch to End', videoArray[videoarraynum] ]); 
	} 

	// when the video is paused
	if (event.data ==YT.PlayerState.PAUSED && pauseFlag[videoarraynum] == false){
		console.log('Videos PAUSE '+titleArray[videoarraynum]);
		//_gaq.push(['_trackEvent', 'Videos', 'Pause', videoArray[videoarraynum] ]); 

		pauseFlag[videoarraynum] = true;
	}

	// when the video is buffered
	if (event.data ==YT.PlayerState.BUFFERING){
		//console.log('Videos Buffering '+titleArray[videoarraynum]);
		//_gaq.push(['_trackEvent', 'Videos', 'Buffering', videoArray[videoarraynum] ]); 
	}

	// when the video is cued
	if (event.data ==YT.PlayerState.CUED){
		//console.log('Videos Cueing '+titleArray[videoarraynum]);
		//_gaq.push(['_trackEvent', 'Videos', 'Cueing', videoArray[videoarraynum] ]); 
	} 
} 

// the end