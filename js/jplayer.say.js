function sayIt(type,Ltext,Rtext,Speaktext) {
  var playerDivId = "jplayer_box";

  var getTextToSpeechURL = function(text) {
    return "http://tts-api.com/tts.mp3?q=" + encodeURIComponent(text);
  };

  var say = function(Ltext, Rtext, Speaktext) {
    var playerDiv = $("<div style='width: 0px; height: 0px;' id='" + playerDivId + "'></div>");
    var bodyObject = $("body");
    if (bodyObject.size()) {
      bodyObject.append(playerDiv);
      playerDiv.jPlayer({
        ready: function () {          
          $(this).jPlayer("setMedia", {"mp3": getTextToSpeechURL(Speaktext)}).jPlayer("play");      
        }
        ,
        ended: function (){
          if (type=="page_text") {
            $('#audio_load_alert').fadeOut();
            br.right("speak_src"); //sends "speak_src" parameter to flipper, contidional runs "speakPagealoud"
            speakPagealoud('autoflip');
            $("#jplayer_box").remove(); 

          }
        }

      });    

    } else {
      alert("No <body> node to attach to.");
    }
  };

  say(Ltext,Rtext,Speaktext);
  }

// function to stop speakaloud / autoflip
function sayItstop () {
  $("#jplayer_box").jPlayer("stop").remove();
  $('#audio_load_alert').fadeOut();

}