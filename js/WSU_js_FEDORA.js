//////////////////////////////////////////////////////////////////////////////////////
//Postlaunch operations
function postLaunch() {    

    //show minimize arrow, looks nicer post launch
    $("#WSUtoolbar_minimize").show();

    //set OCR status
    br.OCRstatus = false;

    //icons prep
    $(".OCR_tools").hide();

    //create large navigation arrows - 2 second bold to show user they are there
    bigArrows();
    bigArrowsPulse();   


} //closes postLaunch()


//////////////////////////////////////////////////////////////////////////////////////
//Other Functions

//FTS search results
function getFTSResultsStatic (row_start, fts_box_mode) {

    showLoading();

    // var search_term = form.fts.value;
    var search_term = $('#fts_input').val();
    var squery = 'http://141.217.97.167:8080/solr/bookreader/select/?q=OCR_text:'+search_term+'&fq=ItemID:'+br.ItemID+'&sort=page_num%20asc&start='+row_start+'&rows=10&indent=on&hl=true&hl.fl=OCR_text&hl.snippets=1000&hl.fragmenter=gap&hl.fragsize=70&wt=json&json.wrf=callback';
    console.log(squery);

    //blank search conditional
    if (search_term == ""){
        hideLoading();
        alert("Please enter a search term");
        return;
    }

    //expands FTS results if collapsed
    var fts_accord = br.fts_accord;
    if (fts_accord == "collapsed") {
        accordFTSResultsStatic();
    }

    //Create hidden Full-Text Search static box
    if (br.fts_displayed == false){
        $fts_static = $('<div id="fts_box_text_static" class="shadow"></div>');
        $('body').append($fts_static);
    }

    //clear previous results            
    $("#fts_box_text_static").html('<p id="fts_terms"></p>');

    
    
    //conditional for plain text (follows acquisition of search term)                    
    if (br.plainTextStatus == true){
        //resize html_concat
        $('#html_concat').css('margin-left','325px');
        $('#html_concat').width($(window).width() - 365)

        //unhighlight previous        
        $("#html_concat p").unhighlight(function(){
            $("#html_concat p").highlight(br.search_term, { wordsOnly: true });
        });
    }

    //pagination counters
    var prev = row_start - 10;
    var next = row_start + 10;

    //function for checking odd or even (leaf side)
    function isEven(value) {
        return (value % 2 == 0);
    }

    //solr query
    $.ajax({          
      url: squery,
      dataType: 'jsonp',
      jsonpCallback: 'callback',
      success: function(result) {
        var cURL = window.location.href;         
        var Parent = document.getElementById('fts_box_text_static');
        
        // conditional for no results
        if (result.response.numFound == 0) {                    
            $('#fts_terms').html('Search results for: "' + search_term + '"');
            var NewDiv = document.createElement('DIV');
            NewDiv.innerHTML = '<div><p>No results found.</p></div>';
            Parent.appendChild(NewDiv);            
        }

        else {

            //set class_counter for alternating background color
            class_counter = 0;

            $('#fts_terms').html('Search results for: "<span class="fts_highlight">' + search_term + '</span>"');
            $('#fts_terms').append('<div id="fts_counts"></div>');            
            $('#fts_counts').append('Found on '+result.response.numFound+' pages.</br>');
            
            // console.log(result.response.docs[0].page_num);
            // console.log(result.response.docs.length);
            // console.log(result.response.docs[9].page_num);
            var results_pages = result.response.docs.length;
            if (next < result.response.numFound){
                $('#fts_counts').append('Results for pages: '+result.response.docs[0].page_num+' - '+result.response.docs[results_pages - 1].page_num);  //change to actual pages being displayed.
            }
            else {
                $('#fts_counts').append('Displaying pages '+result.response.docs[0].page_num+' - '+result.response.docs[results_pages - 1].page_num);    
            }

            //create results wrapper
            $("#fts_box_text_static").append("<div id='fts_results_wrapper'></div>");            
            
            // get all highlights from page set (snippets)
            var snippets = result.highlighting;            
            var snippet_keys = Object.keys(snippets);
            // console.log(snippets);
            // console.log(snippet_keys);

            //iterate through documents with matches
            for (var i = 0; i < snippet_keys.length; i++) {

                // iterate through OCR_text.Array for each snippet, grabbing the page number from the Object Key
                // example navigation --> console.log(snippets[snippet_keys[i]].OCR_text[0]);
                for (var j = 0; j < snippets[snippet_keys[i]].OCR_text.length; j++) {
                    // console.log(snippets[snippet_keys[i]].OCR_text[j]);
                    var OCR_snippet = snippets[snippet_keys[i]].OCR_text[j];

                    var snippet_text = '<a href="#" onclick="br.jumpToIndex('+(result.response.docs[i].page_num - 1)+');">page: <b>' + result.response.docs[i].page_num + '</a></b><br>"...' + OCR_snippet + '..."<br><br>';
                    $('#fts_results_wrapper').append('<div class="fts_result" id="fts_result_'+class_counter+'"></div>');                
                    $("#fts_result_"+class_counter).html(snippet_text);
                    if (class_counter % 2 === 0){
                      $("#fts_result_"+class_counter).addClass('osc_dark');
                    }               

                    //bump alternating background class class_counter
                    class_counter++;               

                } // closes document itereations
            } // closes Solr results retrieval

            //add pagination navigation
            $('#fts_box_text_static').append('<div class="fts_nav shadow_bottom" id="fts_top_nav"></div>');                        
            if (row_start == 0 && result.response.numFound < 10){                
                $('#fts_counts').append('</br></br></br>');
                return;
            }            
            else if (row_start == 0 && result.response.numFound > 10){            
                $('.fts_nav').append('<a class="fts_page_nav fts_next" onclick="getFTSResultsStatic('+next+'); return false;">Next 10 pages</a>');
            }                    
            else {                
                if (next < result.response.numFound) {
                    $('.fts_nav').append('<a class="fts_page_nav fts_next" onclick="getFTSResultsStatic('+next+'); return false;">/ Next 10 pages</a>');
                }
                $('.fts_nav').append('<a class="fts_page_nav fts_previous" onclick="getFTSResultsStatic('+prev+'); return false;">Previous 10 pages</a>');
            }

            //prepend fts_page_nav class to top
            $('#fts_top_nav').insertAfter('#fts_terms','</br>');            
            // $('.fts_nav').append('</br></br>');            
            
            //add result sets at bottom, use "result.response.numFound"
            $('#fts_box_text_static').append('<div class="fts_set_nav shadow_top" id="fts_bottom_nav">Result sets: </div>');            
            var sets = Math.ceil(parseInt(result.response.numFound) / 10);
            // console.log("FTS sets: "+sets);
            for (var i = 0; i < sets; i++){
                var set_seed = i * 10;
                var row_set = (i*10+1) + "-" + (i*10+10) + ", ";                
                $("#fts_bottom_nav").append('<a class="fts_set" onclick="getFTSResultsStatic('+set_seed+'); return false;">'+row_set+'</a>');                
            }                                                

            // delete last comma
            var temp_str = $(".fts_set:last-child").html();
            var new_str = temp_str.substring(0, temp_str.length - 2);
            $(".fts_set:last-child").html(new_str);                        
            
            //if FTS displayed already, fts_wrapper here...
            if (br.fts_displayed == true){
                resizeFTSWrapper();
            }
        }
        
      }
    });    
   
    br.fts_results_row = row_start;
    //set search-term global variable
    br.search_term = search_term;
    displayFTSResultsStatic(row_start, search_term);
}

//Display FTS results Static
function displayFTSResultsStatic(row_start, search_term){

    //draw and position search results
    var fts_handle_static = $('#fts_box_text_static');                                        
    fts_handle_static.position({my: "left top", at: "left bottom", offset: "0 0", of: '#WSUtoolbar'});      
    $('#fts_box_text_static').height($('#BRcontainer').height() - 15);      

    //create buttons for closing and pop-out
    fts_handle_static.prepend("<div class='icon tools right' id='fts_static_tools'></div>");
    $('#fts_static_tools').append('<ul class="the-icons" id="fts_icons_list"><li><span style="font-size:1.5em; font-weight:bold;">Full-Text Search Results</span></li></ul>');
    $('#fts_icons_list').append('<li><i class="icon-remove" onclick="hideFTSResultsStatic(); return false;"></i></li><li><i id="fts_accordian" class="icon-chevron-left" onclick="accordFTSResultsStatic(); return false;"></i></li>'); 

    //display if not already drawn, and resize fts_wrapper when animation complete
    if (br.fts_displayed == false){    
        fts_handle_static.fadeIn(function(){resizeFTSWrapper();});
    }
    
    //highlight string(s) on image
    renderImageHighlights(search_term);

    //highlight matched strings on plain text
    if (br.plainTextHighlights == true){
        removePlainTextHighlights();
    }
    if (br.plainTextStatus == true){
        renderPlainTextHighlights(search_term);
    }

    //stop loading animation
    hideLoading();

    //set variables
    br.fts_displayed = true;    
    return false;
}

function resizeFTSWrapper(){
        $("#fts_box_text_static").ready(function(){
            $("#fts_results_wrapper").height(                 
                //last integer equals total margin height of #fts_bottom_nav
                $("#fts_box_text_static").height() - ($("#fts_static_tools").height() + $("#fts_terms").height() + $("#fts_top_nav").height() + $("#fts_bottom_nav").height() + 75)
            );
        });        
}

//Hide FTS results Static
function hideFTSResultsStatic(){
    $('#fts_box_text_static').fadeOut("normal", function() {
        $(this).remove();
    });
    if (br.plainTextStatus == true) {
        $('#html_concat').css('margin','auto');
        $('#html_concat').width($(window).width() - 40)
    }
    br.fts_displayed = false;

    //image / plain text highlights highlights
    removeImageHighlights();
    removePlainTextHighlights();
    br.imageHighlights = false;


}

//Collapse FTS results Static
function accordFTSResultsStatic() {
    var fts_accord = br.fts_accord; //localize global variable, why necessary for if conditionals?

    //collapse
    if (fts_accord == "expanded" ){
        var accord_box = $('#fts_box_text_static');
        accord_box.css({
            'overflow':'hidden',
        });        
        accord_box.animate({width:30,},500);
        $('#fts_box_text_static').children().hide();
        $('#fts_static_tools').show();
        $('#fts_static_tools span').hide();
        $('#fts_accordian').removeClass('icon-chevron-left').addClass('icon-chevron-right');
        br.fts_accord = "collapsed";
        return
    }
    //expand
    if (fts_accord == "collapsed") {
        $('#fts_box_text_static').animate({width:300},500,function(){
            $('#fts_box_text_static').children().show();
            $('#fts_static_tools span').show();
        });        
        
        $('#fts_accordian').removeClass('icon-chevron-right').addClass('icon-chevron-left');
        br.fts_accord = "expanded";
        return
    }
}

// OCR overlays
//Show OCR
function showOCR(adjust) {

        //global variable for detecting if OCR is on or off
        br.OCRstatus = true;

        //get page numbers and page mode
        var $current_layout = getPageInfo();
        var rootpage = $current_layout.rootpage;
        var secondarypage = $current_layout.secondarypage;
        var mode = $current_layout.mode;  
        
        //2up mode --> ajax call for OCR html
        if (mode == "2up"){                           

            // convert ItemID to PIDsafe
            var PIDsafe = br.ItemID.replace(/_/g,"");

            //page URL's
            var leftOCR_URL = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+':HTML&datastream=HTML_'+(rootpage - 1).toString();
            var rightOCR_URL = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+':HTML&datastream=HTML_'+(secondarypage - 1).toString();            
            
            $(document).ready(function(){
              $.ajax({
                type: "GET",
                url: leftOCR_URL,
                dataType: "html",
                success: paintOCR_left
              });
            });            

            function paintOCR_left(html){                
                if (rootpage == 1){ //conditional for cover
                    $('#BRtwopageview').append("<div class='OCR_box right pbox_border OCR_shadow'><div class='OCR_box_text OCR_right'></div></div>");                            
                    $('.OCR_box.right .OCR_box_text').load(leftOCR_URL);
                }
                else if (rootpage == br.numLeafs){ //conditional for back page
                    $('#BRtwopageview').append("<div class='OCR_box left pbox_border OCR_shadow'><div class='OCR_box_text OCR_left'></div></div>");
                    $('.OCR_box.left .OCR_box_text').load(leftOCR_URL); 
                }
                else {
                    $('#BRtwopageview').append("<div class='OCR_box left pbox_border OCR_shadow'><div class='OCR_box_text OCR_left'></div></div>");
                    $('.OCR_box.left .OCR_box_text').append(html);
                    $(document).ready(function(){
                      $.ajax({
                        type: "GET",
                        url: rightOCR_URL,
                        dataType: "html",
                        success: paintOCR_right
                      });
                    });                                        
                }
                $('.OCR_box').fadeIn();
            }

            function paintOCR_right(html){                
                $('#BRtwopageview').append("<div class='OCR_box right pbox_border OCR_shadow'><div class='OCR_box_text OCR_right'></div></div>");
                $('.OCR_box.right .OCR_box_text').append(html);
                $('.OCR_box').fadeIn();
            }
        } 

        //1up mode --> call singlepageOCR()
        if (mode == "1up"){
            singlepageOCR();            
        }
            
    }

//1up OCR function
function singlepageOCR() {
    //consider adding to pages up and below?
    $('.OCR_box_single').remove();  
    var $current_layout = getPageInfo();
    var rootpage = $current_layout.rootpage;

    //creates div, hidden still    
    $('#BRpageview').append("<div class='OCR_box_single pbox_border'><div class='OCR_box_text'></div></div>");
    //get dimensions and position of current page image layout
    var rootpage_divoffset = rootpage - 1; //alteration for single page view, where div# is one behind image number
    var root_div = '#pagediv'+rootpage_divoffset.toString();
    var page_position = $(root_div).position();    
    
    //1) set width and height
    var height = parseInt($(root_div).css('height')) *.90;
    var width = parseInt($(root_div).css('width')) *.90;
    //2) set absolute position
    var top_offset = height * .05;
    var top = parseInt($(root_div).css('top')) + top_offset;
    var left_offset = width * .05;
    var left = parseInt($(root_div).css('left')) + left_offset;

    // convert ItemID to PIDsafe
    var PIDsafe = br.ItemID.replace(/_/g,"");

    //page URL
    var leftOCR_URL = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+':HTML&datastream=HTML_'+(rootpage - 1).toString();

    //insert results
    $(document).ready(function(){
      $.ajax({
        type: "GET",
        url: leftOCR_URL,
        dataType: "html",
        success: paintOCR_single
      });
    });

    function paintOCR_single(html){        
        $('.OCR_box_single .OCR_box_text').append(html);
        
        //set OCR overlay dimensions and position
        $('.OCR_box_single').css({
            'height':height,
            'width':width,
            'top':top,
            'left':left
            });   
        
        $('.OCR_box_single').fadeIn();
        }    
}

//Hide OCR
function hideOCR (){
    //add conditional for 2up & 1up modes
    br.OCRstatus = false;    
    $('.OCR_box, .OCR_box_single').fadeOut(function() {
        $('.OCR_box, .OCR_box_single').remove();
    });        
}

function toggleOCR() {

    //plain text conditional
    if (br.plainTextStatus == true){
        if (br.plainOCRstatus == true){
            $('.OCR_tools').fadeOut();
            $('.toggleOCR').css("border", "none");
            br.plainOCRstatus = false;            
        }
        else{
            $('.OCR_tools').fadeIn();
            // $('.toggleOCR').addClass("rounded_edge_highlight").css("border","1px solid rgba(247,227,0,.8)");
            $('.toggleOCR').addClass("active_icon");            
            br.plainOCRstatus = true;
        }
        return;        
    }

    //image behaviour
    else{
        if (br.OCRstatus == false){
            showOCR();
            // show OCR controls
            $('.OCR_tools').fadeIn();
            // $('.toggleOCR').addClass("rounded_edge_highlight").css("border","1px solid rgba(247,227,0,.8)");        
            $('.toggleOCR').addClass("active_icon");
            return;
        }    
        if (br.OCRstatus == true){
            hideOCR();
            // hide OCR tools
            $('.OCR_tools').fadeOut();
            // $('.toggleOCR').css("border", "none");
            $('.toggleOCR').removeClass("active_icon");
            return;
        }
    }
}

// read pages aloud
// e.g. http://141.217.97.167:8080/solr/bookreader/select/?q=page_num:15&fq=ItemID:letter_city&wt=json&json.wrf=callback
function speakPagealoud(source) {
     
    var $current_layout = getPageInfo();
    if (source=="autoflip"){
        $current_layout.rootpage = $current_layout.rootpage + 2;
        $current_layout.secondarypage = $current_layout.secondarypage + 2;
    }
    var squery = 'http://141.217.97.167:8080/solr/bookreader/select/?q=page_num:['+$current_layout.rootpage+' TO '+$current_layout.secondarypage+' ]&fq=ItemID:'+br.ItemID+'&wt=json&json.wrf=callback';

    // loading information
    $('#audio_load_alert').fadeIn();
    // sayIt("loading","null","null","audio loading");    

    //1up solr query and speak
    if ($current_layout.mode == "1up") {        
        $.ajax({          
          url: squery,
          dataType: 'jsonp',
          jsonpCallback: 'callback',
          success: function(result) {
            var Singletext = result.response.docs[0].OCR_text;
            var Speaktext = "Single Page - "+Singletext;
            sayIt("page_text","null","null",Speaktext);        
          }
        });
    }

    //2up solr query and speak
    if ($current_layout.mode == "2up") {        
        $.ajax({          
          url: squery,
          dataType: 'jsonp',
          jsonpCallback: 'callback',
          success: function(result) {
            var Ltext = result.response.docs[0].OCR_text;
            var Rtext = result.response.docs[1].OCR_text;
            var Speaktext = "Left page - "+Ltext+"- Right page - "+Rtext;
            sayIt("page_text",Ltext,Rtext,Speaktext);        
          }
        });
    }
    
}

// increase / decrease font size ("delta" as "increase" or "decrease")
// works for both OCR overlays and plain text display
function fontResize(delta){ 

    // font-size conversion array
    var conv_array = [ '6px', 'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '72px', '90px' ];

    if (br.plainTextStatus == true){                        
        var font_tags = $('#html_concat font');        
        font_tags.each(function () {  //each tag is"this"      
            var font_handle = $(this); //removed children, as it is "this"            
            var fsize = font_handle[0].style.fontSize;        
            var fsize_index = conv_array.indexOf(fsize);        
            if (delta == "increase"){
                fsize_index += 1;
                font_handle.css('font-size', conv_array[fsize_index])
            }
            if (delta == "decrease"){
                fsize_index -= 1;
                font_handle.css('font-size', conv_array[fsize_index])
            }                
        });
        
    }

    else{        
        var font_tags = $('.OCR_box_text font');        
        font_tags.each(function () {  //each tag is"this"
            var font_handle = $(this); //removed children, as it is "this"                     
            var fsize = font_handle[0].style.fontSize;        
            var fsize_index = conv_array.indexOf(fsize);        
            if (delta == "increase"){
                fsize_index += 1;
                font_handle.css('font-size', conv_array[fsize_index])
            }
            if (delta == "decrease"){
                fsize_index -= 1;
                font_handle.css('font-size', conv_array[fsize_index])
            }                
        });
    }
}


// flip navigation arrows for 1up / 2up (remove in thumbs?)
function arrowsFlip (new_mode) {
    if (new_mode == '1up'){
        $('#front_nav').removeClass().addClass('tool_icon arrow_upmost rollover');
        $('#previous_nav').removeClass().addClass('tool_icon arrow_up rollover');
        $('#next_nav').removeClass().addClass('tool_icon arrow_down rollover');
        $('#back_nav').removeClass().addClass('tool_icon  arrow_downmost rollover');
    }
    if (new_mode == '2up'){
        $('#front_nav').removeClass().addClass('tool_icon arrow_leftmost rollover');
        $('#previous_nav').removeClass().addClass('tool_icon arrow_left rollover');
        $('#next_nav').removeClass().addClass('tool_icon arrow_right rollover');
        $('#back_nav').removeClass().addClass('tool_icon  arrow_rightmost rollover');    
    }
    
}

// suite of functions to launch different modes from bookreader.html buttons, as a conditional for coming from thumbnail mode
function launch1up (){
    //turns off OCR
    if (br.OCRstatus == true) {
        toggleOCR();        
    }

    //turns off plain text if on
    if (br.plainTextStatus == true){
        plainText();
    }

    var $current_layout = getPageInfo();    
    if ($current_layout.mode = 'thumb'){
        var to_1up = window.location.protocol + "//" + window.location.host+window.location.pathname+window.location.search+"#page/"+$current_layout.rootpage+"/mode/1up";        
        window.location = to_1up;
    }
    else{
        br.SwitchMode(1);
    }
}

function launch2up (){
    //turns off OCR
    if (br.OCRstatus == true) {
        toggleOCR();
    }

    //turns off plain text if on
    if (br.plainTextStatus == true){
        plainText();
    }

    var $current_layout = getPageInfo();
    if ($current_layout.mode = 'thumb'){
        var to_2up = window.location.protocol + "//" + window.location.host+window.location.pathname+window.location.search+"#page/"+$current_layout.rootpage+"/mode/2up";
        window.location = to_2up;    
    }
    else {
        br.SwitchMode(2);
    }
}

function launchThumbs (){
    //turns off OCR
    if (br.OCRstatus == true) {
        toggleOCR();
    }

    //turns off plain text if on
    if (br.plainTextStatus == true){
        plainText();
    }

    var $current_layout = getPageInfo();
    var to_thumbs = window.location.protocol + "//" + window.location.host+window.location.pathname+window.location.search+"#page/"+$current_layout.rootpage+"/mode/thumb";
    window.location = to_thumbs;
}


//magnifying loupe toggle on page
//add click/destroy
function magLoupe(){
    //determine layout and select appropriate class
    var $current_layout = getPageInfo();
    if ($current_layout.mode == "2up"){
        var mag_select = ".BRpageimage";
    }
    else if ($current_layout.mode == "1up"){        
        var mag_select = '.BRnoselect';
    }    

    if (br.loupe_status == false){
        br.loupe_status = true;
        $(mag_select).loupe({
            width: 225, // width of magnifier
            height: 175, // height of magnifier
            loupe: 'loupe' // css class for magnifier
        });
        $(mag_select).data('loupe', true);
    }
    else {
        br.loupe_status = false;
        $(mag_select).data('loupe', false);
        //remove all but first couple 'loupe' class divs - convoluted but works
        var loupers = $('.loupe');
        if (loupers.length > 3){            
            for (var i = loupers.length; i > 0; i--) {                
                $(loupers[i-1]).remove();
            }    
        }        
    }
}

// fullscreen mode
function fullScreen(callback){      

    //calls "fullscreen_API"
    if (fullScreenApi.supportsFullScreen) {        
        var reader_handle = $("#BRcontainer")[0]; //works, only for the pages...        
        fullScreenApi.requestFullScreen(reader_handle);        
    }
    callback();

}

function goFullScreen(){
    fullScreen(function(){
            //code for post-full screen operations can go here
            // $("#BRcontainer").append($("#overlays")[0]);            
            // bigArrows();
            // bigArrowsPulse();
            // console.log($("#BRcontainer"));
        }
    );
}

//draw up-down nav arrows
function drawArrowsVert(page_mode) {
    //get book dimensions
    var bookwidth = $('#BRpageview').width();
    var windowheight = $(window).height();    

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // navigation arrows for thumbnail mode currently does not work
    // tied to line 1334 from WSU_bookreader.js
    // need to determine 1st image on screen, but getCurrentIndex and hashing the URL don't provide reliable numbers.
    // get it from the DOM?
    if (page_mode == "thumbs"){        
        var dArrow = "<div id='dBigArrow' align='center' class='bigArrowBoxVert bigArrowHandle' onclick='br.jumpToIndex("+'"thumb_button"'+"); return false;'><img class='absoluteCenter' src='images/icons/big_arrow_down.png' width=35/></div>";
        var uArrow = "<div id='uBigArrow' align='center' class='bigArrowBoxVert bigArrowHandle' onclick='br.jumpToIndex("+'"thumb_button"'+"); return false;'><img class='absoluteCenter' src='images/icons/big_arrow_up.png' width=35/></div>";           
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////            

    else{
        // creates arrow background boxes
        var dArrow = "<div id='dBigArrow' align='center' class='bigArrowBoxVert bigArrowHandle' onclick='br.right(); return false;'><img class='absoluteCenter' src='images/icons/big_arrow_down.png' width=35/></div>";
        var uArrow = "<div id='uBigArrow' align='center' class='bigArrowBoxVert bigArrowHandle' onclick='br.left(); return false;'><img class='absoluteCenter' src='images/icons/big_arrow_up.png' width=35/></div>";
    }

    $('#overlays').append(dArrow);
    $('#overlays').append(uArrow);

    // conditional for width of page; if wider, make buttons 90% of window
    if (bookwidth < $(window).width()) {
        $('.bigArrowBoxVert').width(bookwidth * .95);
        // $('#dBigArrow').offset({ top: windowheight - 85, left: $(window).width() / 2 - $('.bigArrowBoxVert').width() / 2});
        $('#dBigArrow').offset({ top: windowheight - 33, left: $(window).width() / 2 - $('.bigArrowBoxVert').width() / 2});
        $('#uBigArrow').offset({ top: 38, left: $(window).width() / 2 - $('.bigArrowBoxVert').width() / 2});
    }

    else { //if boxes will not fit next to pages        
        $('.bigArrowBoxVert').width( $(window).width() * .95);
        $('#dBigArrow').offset({ top: windowheight - 85, left: $(window).width() / 2 - $('.bigArrowBoxVert').width() / 2});
        $('#uBigArrow').offset({ top: 45, left: $(window).width() / 2 - $('.bigArrowBoxVert').width() / 2});
    }
}

function drawArrowsHoriz() {    
    //get book dimensions
    var bookwidth = $('#BRtwopageview').width();
    var bookheight = $('#BRtwopageview').height();                        

    // creates arrow background boxes
    var rArrow = "<div id='rBigArrow' class='bigArrowBoxHoriz bigArrowHandle' onclick='br.right(); return false;'><img class='absoluteCenter' src='images/icons/big_arrow_right.png' width=35/></div>";
    var lArrow = "<div id='lBigArrow' class='bigArrowBoxHoriz bigArrowHandle' onclick='br.left(); return false;'><img class='absoluteCenter' src='images/icons/big_arrow_left.png' width=35/></div>";       
    $('#overlays').append(rArrow);
    $('#overlays').append(lArrow);    

    //sets size at 90% of height and offsets from page edges
    if (bookwidth + 120 < $(window).width()) {
        $('.bigArrowBoxHoriz').height($('.BRleafEdgeR').height() * .9);
        $('#rBigArrow').position({my: "left center", at: "right center", offset: "2 0", of: '.BRleafEdgeR'});
        $('#lBigArrow').position({my: "right center", at: "left center", offset: "-2 0", of: '.BRleafEdgeL'});
    }

    else { //if boxes will not fit next to pages        
        //determine button height (specifically for portrait monitors)        
        if (bookheight > $(window).height() - 100){
            var button_height = $(window).height() - 100;    
        }
        else {
            var button_height = bookheight * .95;
        }               

        $('.bigArrowBoxHoriz').height(button_height);        
        $('#rBigArrow').offset({ top: $(window).height() / 2 - button_height / 2, left: $(window).width() - 50});
        $('#lBigArrow').offset({ top: $(window).height() / 2 - button_height / 2, left: 10});
    }
}

// easy page flip arrows
function bigArrows(state){

    var $current_layout = getPageInfo();    

    if (br.bigArrowStatus == false || state == "resize" || state == "state_change"){

        //sets status
        br.bigArrowStatus = true;

        // in the case of resizing, removes previous
        if (state == "resize" || state == "state_change"){
            $('.bigArrowHandle').remove();            
        }

        // run draw1upArrows, draw2upArrows, or drawThumbsArrows here...
        if ($current_layout.mode == "1up"){
            drawArrowsVert();
        }
        if ($current_layout.mode == "2up"){
            drawArrowsHoriz();
        }
        if ($current_layout.mode == "thumb"){ //removes arrows for now from thumbnail mode
            // drawArrowsVert('thumbs');
            br.bigArrowStatus = false;
            $('.bigArrowHandle').remove();
            return
        }               

        //hover functions for big arrow buttons
        $(".bigArrowHandle").hover(
            function(){
                clearTimeout(minimalArrowTimeout);                            
                $(this).stop(true, false).animate({opacity: 0.35}, 300);
            }, 
            function() {                
                $(this).stop(true, false).animate({opacity: .1}, 300);
                minimalArrowTimeout = setTimeout(function (){
                    $(".bigArrowHandle").stop(true, false).animate({opacity: 0}, 300);
                },2000)                
            }
            );       

        return
    }

    // removes arrows in toggling (likely remove)
    if (br.bigArrowStatus == true){
        br.bigArrowStatus = false;
        $('.bigArrowHandle').remove();
        return
    }
}

function bigArrowsPulse(){
    $(".bigArrowHandle").stop(true, false).animate({opacity: .35}, 500);
    minimalArrowTimeout = setTimeout(function (){
        $(".bigArrowHandle").stop(true, false).animate({opacity: 0}, 2000);
    },2500) 
}

function toolbarsMinimize(){
    //seems to work without thumbnail conditionals...

    var $current_layout = getPageInfo();

    if ($('#WSUtoolbar_minimize').hasClass('toolbar_exposed')) {      
        $('#WSUtoolbar').slideUp(750);
        $('#WSUtoolbar_minimize').animate({top:'0px'},{
            duration: 750,
            complete: function(){            
                $("#BRcontainer").css({top:'0px'});
                if ($current_layout.mode == "1up"){
                    br.prepareOnePageView();
                    return;
                }
                if ($current_layout.mode == "2up"){
                    br.prepareTwoPageView();
                }
            }
        });
        $('#WSUtoolbar_minimize').addClass('toolbar_hidden').removeClass('toolbar_exposed');
        $("#minimize_handle").removeClass('icon-chevron-up').addClass('icon-chevron-down');
        
        // if (when) nav arrows are on screen - 1up
        if (br.bigArrowStatus == true){
            if ($current_layout.mode == "1up" || $current_layout.mode == "thumb"){
                $('#dBigArrow').offset({ top: $(window).height() - 50});                
                $('#uBigArrow').offset({ top: 10}); 
            }            
        }

        //extend plain text / HTML
        if (br.plainTextStatus == true){
            $("#html_concat").css('height','100%');            
        }
    }

    else {            
        $('#WSUtoolbar').slideDown(750);
        $('#WSUtoolbar_minimize').animate({top:'35px'},{
            duration: 750,
            complete: function(){            
                $("#BRcontainer").css({top:'30px'});
                if ($current_layout.mode == "1up"){
                    br.prepareOnePageView();                    
                }
                if ($current_layout.mode == "2up"){
                    br.prepareTwoPageView();
                }
                // if plain-text has taken over, resize
                if (br.plainTextStatus == true){
                    resizePlainText();
                }
            }
        });
        $('#WSUtoolbar_minimize').addClass('toolbar_exposed').removeClass('toolbar_hidden');
        $("#minimize_handle").removeClass('icon-chevron-down').addClass('icon-chevron-up');

        // if (when) nav arrows are on screen
        if (br.bigArrowStatus == true){
            if ($current_layout.mode == "1up" || $current_layout.mode == "thumb"){
                bigArrows('resize');               
            }            
        }        
    }
}

function plainText(){    

    var $current_layout = getPageInfo();    

    if (br.plainTextStatus == false){

        showLoading();        

        //2up
        if ($current_layout.mode == '2up'){            
            // 2up
            $("#BRtwopageview").hide();
            $(".bigArrowHandle").hide();            
        }
        //1up
        if ($current_layout.mode == '1up'){            
            $("#BRpageview").hide();
            $(".bigArrowHandle").hide();
        }
        //thumb
        if ($current_layout.mode == 'thumb'){
            alert("Not Available in Thumbnail mode.");
            return;
        }

        //after conditionals, if still proceeding, show loading message and set status to true
        br.plainTextStatus = true;                

        //insert HTML and resize        
        $('#BookReader').append("<div id='html_concat' class='absoluteCenter'></div>");        
        $('#html_concat').hide();            
        $('#html_concat').height($(window).height() - 112);       

        //resizes plain text if FTS is true
        if (br.fts_displayed == true){            
            $('#html_concat').css('margin-left','325px');
            $('#html_concat').width($(window).width() - 365)            
        }
        else{
            $('#html_concat').width($(window).width() - 40)
        }

        ////////////////////////////////////////////////////////////////////////////////////
        var html_concat = '../data/'+br.ItemID+'/fullbook/'+br.ItemID + '.htm';
        $('#html_concat').load(html_concat, function(){            
            //remove justified css from font tags (remove if too slow)
            var font_tags = $('#html_concat p');        
                font_tags.each(function () {  //each tag is"this"
                    if( $(this).css('text-align') == "justify"){
                        $(this).css('text-align','left');
                    }
                });
            $('#html_concat').scrollTo("#page_ID_" + $current_layout.rootpage);
                
            //create page numbers / links
            var page_array = $("#html_concat_wrapper .html_page");
            page_array.each(function(){
                var page_num = $(this).attr('id').split('_')[2];
                // $(this).prepend("<span style='color:blue; float:right;'>Leaf "+page_num+"</div>");
                $(this).prepend('<a class="leaf_num" href="#" onclick="br.jumpToIndex('+page_num+');">Leaf '+page_num+'</a>');
            });

            // highlights br.search_term if active
            if(br.fts_displayed == true){
                renderPlainTextHighlights();
            }
        });
        ////////////////////////////////////////////////////////////////////////////////////

        

        // if FTS true, show highlights
        if (br.fts_displayed == true){                 
            renderPlainTextHighlights(); //Doesn't work, same Ajax / Load problem.....
        }

        $('#html_concat').fadeIn();

        //remove loading
        hideLoading();
        return;

    }

    if (br.plainTextStatus == true){

        //closes OCR tools if opened

        toggleOCR();

        //sets status to false
        br.plainTextStatus = false;

        //returns index / location of scroll
        var seg_locale = getPlainTextLocation().split('_')[2]; //value is return as "page_ID_#", split catches page number

        //clears HTML
        $('#html_concat').remove();
        
        //refresh page entirely
        if ($current_layout.mode == '2up'){                        
            $("#BRtwopageview").fadeIn();
            $(".bigArrowHandle").fadeIn();                                   
        }
        if ($current_layout.mode == '1up'){            
            $("#BRpageview").fadeIn();
            $(".bigArrowHandle").fadeIn();
        }
        if ($current_layout.mode == 'thumb'){
            alert("Not sure how you created these conditions, but you shouldn't be able to close something that never existed...");
        }

        removePlainTextHighlights();
        br.jumpToIndex(parseInt(seg_locale));                
        return;
    }    
}

function resizePlainText(trigger){
    var $current_layout = getPageInfo();

    //hide text
    $("#html_concat").hide();

    showLoading();            

    //2up
    if ($current_layout.mode == '2up'){            
        // 2up
        $("#BRtwopageview").hide();
        $(".bigArrowHandle").hide();            
    }
    //1up
    if ($current_layout.mode == '1up'){            
        $("#BRpageview").hide();
        $(".bigArrowHandle").hide();
    }

    //resize to new window dimensions
    $('#html_concat').height($(window).height() - 112)

    //resizes plain text if FTS is true
    if (br.fts_displayed == true){            
        $('#html_concat').css('margin-left','325px');
        $('#html_concat').width($(window).width() - 365)            
    }
    else{
        $('#html_concat').width($(window).width() - 40)
    }

    //finally, show again
    $("#html_concat").fadeIn();
    hideLoading();

}

// returns page_ID_# of topmost .html_page segment
function getPlainTextLocation(){
    
    var html_pages = $(".html_page");
    for (var i=1;i<html_pages.length;i++){

        if ($(html_pages[i]).position().top > 0 ) {
            var seg_locale = $(html_pages[i]).attr('id');            

            return seg_locale;
        }
    }
}

function renderPlainTextHighlights(){
    // highlights all instances of word in HTML body
    $("#html_concat p").highlight(br.search_term, { wordsOnly: true });
    br.plainTextHighlights == true;    
} 

function removePlainTextHighlights(){
    br.plainTextHighlights == false;
}           

// Function to scrollTo location 
// Also called on line 1427 in WSU_bookreader.js....
$.fn.scrollTo = function( target, options, callback ){
  if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
  var settings = $.extend({
    scrollTarget  : target,
    offsetTop     : 50,
    duration      : 400,
    easing        : 'swing'
  }, options);
  return this.each(function(){
    var scrollPane = $(this);
    var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
    var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
    scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
      if (typeof callback == 'function') { callback.call(this); }
    });
  });
}

function renderImageHighlights(){

    $current_layout = getPageInfo();
    if ($current_layout.mode == undefined){
        return;
    }       

    //clear previous
    $(".image_highlight").remove();   

    // 2up
    if ($current_layout.mode == "2up") {

        // //left XML location
        // var leafStr = '00000';            
        // var htmlStr = $current_layout.rootpage.toString();
        // var re = new RegExp("0{"+htmlStr.length+"}$");
        // var left_xml_doc = '../data/'+ItemID+'/altoXML/'+ItemID+leafStr.replace(re, htmlStr) + '.xml';

        // //right page
        // var leafStr = '00000';            
        // var htmlStr = $current_layout.secondarypage.toString();
        // var re = new RegExp("0{"+htmlStr.length+"}$");
        // var right_xml_doc = '../data/'+ItemID+'/altoXML/'+ItemID+leafStr.replace(re, htmlStr) + '.xml';

        //create URLs
        var left_xml_doc = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':altoXML&datastream=altoXML_'+$current_layout.rootpage.toString()+'&datatype=html';
        var right_xml_doc = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':altoXML&datastream=altoXML_'+$current_layout.secondarypage.toString()+'&datatype=html';

        drawBoxes($current_layout.mode, $current_layout.rootpage, left_xml_doc,br.search_term,'l');
        drawBoxes($current_layout.mode, $current_layout.secondarypage, right_xml_doc,br.search_term,'r');
    }

    // 1up
    if ($current_layout.mode == "1up") {            
        //current XML location
        // var leafStr = '00000';            
        // var htmlStr = $current_layout.rootpage.toString();
        // var re = new RegExp("0{"+htmlStr.length+"}$");
        // var single_current_xml_doc = '../data/'+ItemID+'/altoXML/'+ItemID+leafStr.replace(re, htmlStr) + '.xml';

        //create URLs
        var single_current_xml_doc = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':altoXML&datastream=altoXML_'+$current_layout.rootpage.toString()+'&datatype=html';
        console.log(single_current_xml_doc);

        drawBoxes($current_layout.mode, $current_layout.rootpage, single_current_xml_doc, br.search_term,'single'); //current page
    
        // //page below XML location
        // var leafStr = '00000';            
        // var htmlStr = ($current_layout.rootpage + 1).toString();
        // var re = new RegExp("0{"+htmlStr.length+"}$");
        // var single_below_xml_doc = '../data/'+ItemID+'/altoXML/'+ItemID+leafStr.replace(re, htmlStr) + '.xml';
        // drawBoxes($current_layout.mode, ($current_layout.rootpage + 1), single_below_xml_doc, br.search_term,'single'); //page below            
    
        // //page above XML location
        // var leafStr = '00000';            
        // var htmlStr = ($current_layout.rootpage - 1).toString();
        // var re = new RegExp("0{"+htmlStr.length+"}$");
        // var single_above_xml_doc = '../data/'+ItemID+'/altoXML/'+ItemID+leafStr.replace(re, htmlStr) + '.xml';                        
        // drawBoxes($current_layout.mode, ($current_layout.rootpage - 1), single_above_xml_doc, br.search_term,'single'); //page above                            
    }
}

function drawBoxes(page_mode, image_index, xml_doc, search_term, leaf_side, match_indices){

    // check if quoted phrase
    if (br.search_term.startsWith('"') == true){
        var mult_terms_status = true;
        var mult_terms = search_term.split(" "); //will remove quotes in comparison cleanse
        //clean and check against array
        var mult_terms_stripped = new Array();
        for (var i = 0; i < Object.keys(mult_terms).length; i++){
             mult_terms_stripped.push( mult_terms[i].replace(/["'\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"") );
        }
    }

    //prepare 1up and 2up variables
    var confirmed_orig_boxes = new Array();    
    var search_term_stripped = search_term.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();  


    // 2up - prepare variables
    if (page_mode == '2up'){   
        var page_matches_array = new Array();
        
        $.get(xml_doc,{},function(xml){

            //do once for each page
            var c_info = new Array(); // current image as displayed
            var img_container = $("#BRtwopageview").position();
            var c_position = $("#"+image_index).position();
            c_info['height'] = $("#"+image_index).height();
            c_info['width'] = $("#"+image_index).width();
            c_info['vpos'] = c_position.top;
            c_info['hpos'] = c_position.left;
            page_matches_array.push(c_info);               

            var s_info = new Array(); // source image
            s_info['height'] = parseInt($('PrintSpace',xml).attr('HEIGHT'));
            s_info['width'] = parseInt($('PrintSpace',xml).attr('WIDTH'));
            page_matches_array.push(s_info);              
              
            //itereate through Strings in page, match search_term, push info to page_array            
            var orig_boxes = new Array();
            var temp_orig_boxes = new Array();
            var string_index = new Array();
            $('String',xml).each(function(i) {                                
                //XML strings                
                content_string = $(this).attr('CONTENT');
                //clean variables for comparison
                var content_string_stripped = content_string.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();                                
                
                // phrase conditional
                //consider making temp array, then popping out ones next to each other into "o_info" array
                if (mult_terms_status == true){                    
                    
                    for (var j = 0; j < Object.keys(mult_terms_stripped).length; j++){
                        // check for matching terms in document, push to list with location. Then, look for sequential numbers in index and pull those words out to highlight
                        if (mult_terms_stripped[j] == content_string_stripped) {                                                        
                            string_index.push(parseInt(i));
                            temp_orig_boxes.push($(this));                                                        
                        }
                    }                    
                }

                else { //single word
                    if (content_string_stripped == search_term_stripped) {
                        temp_orig_boxes.push($(this));             
                    }
                }                
            }); //closes each loop                            
                            
            if (mult_terms_status == true){                
                //find indices of sequential, pushes these from temp_orig_boxes into confirmed_orig_boxes array
                var phrase_indices = findSeq(string_index); //gets indices of sequential numbers
                console.log(phrase_indices);
                if (phrase_indices == null){
                    return;
                }                                
                for (var i = 0; i < phrase_indices.length; i++){
                    for (var j = 0; j < mult_terms_stripped.length; j++){                        
                        confirmed_orig_boxes.push(temp_orig_boxes[(phrase_indices[i]+j)]);
                    }
                }
            }
            else{//copy single word temp to confirmed
                confirmed_orig_boxes = temp_orig_boxes;
            }                
            
            // create orig_boxes array from confirmed_orig_boxes array elements
            for (var i = 0; i < Object.keys(confirmed_orig_boxes).length; i++){
                var o_info = new Array(); // original dimensions and location of string relative to source image (s_info)
                // original dimensions and coordinates                                                            
                o_info['height'] = parseInt(confirmed_orig_boxes[i].attr('HEIGHT'));
                o_info['width'] = parseInt(confirmed_orig_boxes[i].attr('WIDTH'));
                o_info['vpos'] = parseInt(confirmed_orig_boxes[i].attr('VPOS'));
                o_info['hpos'] = parseInt(confirmed_orig_boxes[i].attr('HPOS'));
                orig_boxes.push(o_info);
            }             

            // XML parsing done, push ORIGINAL box dimensions to page_matches_array
            page_matches_array.push(orig_boxes);

            //create boxes - iterate through page_matches_array[2] (matches dimensions)
            for (var i=0;i<page_matches_array[2].length;i++){
                // creates fresh highlight box array for each
                var h_info = new Array(); // dimensions and coords of highlight box

                //highlight box coordinates and size
                h_info['height'] = parseInt((page_matches_array[2][i]['height'] / s_info['height']) * c_info['height']);
                h_info['width'] = parseInt((page_matches_array[2][i]['width'] / s_info['width']) * c_info['width']);
                h_info['vpos'] = parseInt((page_matches_array[2][i]['vpos'] / s_info['height']) * c_info['height']);
                h_info['hpos'] = parseInt((page_matches_array[2][i]['hpos'] / s_info['width']) * c_info['width'] + c_info['hpos']);
                // console.log("highlight box",h_info);

                //draw boxes where "i" is the current match number
                $("#BRtwopageview").append("<div id='"+leaf_side+"_match_"+i+"' style='display:none;' class='image_highlight'></div>"); //number with match indices...
                $('#'+leaf_side+'_match_'+i).css({
                    'height': h_info['height'],
                    'width': h_info['width'],
                    'top': h_info['vpos'],
                    'left': h_info['hpos']
                },1000);
                $('.image_highlight').fadeIn();            
            }
        }); //closes ajax "get" request

    } //closes 2up mode

    // 1up
    if (page_mode == "1up"){        
        var page_matches_array = new Array();

        $.get(xml_doc,{},function(xml){

            //do once for each page            
            var img_container = $("#pagediv"+(image_index - 1));

            var c_info = new Array(); // current image as displayed
            var c_position = img_container.position();
            c_info['height'] = img_container.height();
            c_info['width'] = img_container.width();
            c_info['vpos'] = c_position.top;
            c_info['hpos'] = c_position.left;
            page_matches_array.push(c_info);   
            // console.log("current image",c_info);

            var s_info = new Array(); // source image
            s_info['height'] = parseInt($('PrintSpace',xml).attr('HEIGHT'));
            s_info['width'] = parseInt($('PrintSpace',xml).attr('WIDTH'));
            page_matches_array.push(s_info);  
            // console.log("source image",s_info);        
               
            //itereate through Strings in page, match search_term, push info to page_array            
            var orig_boxes = new Array();
            var temp_orig_boxes = new Array();
            var string_index = new Array();
            $('String',xml).each(function(i) {                                
                //XML strings                
                content_string = $(this).attr('CONTENT');
                //clean variables for comparison
                var content_string_stripped = content_string.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();                                
                
                // phrase conditional
                //consider making temp array, then popping out ones next to each other into "o_info" array
                if (mult_terms_status == true){                    
                    
                    for (var j = 0; j < Object.keys(mult_terms_stripped).length; j++){
                        // check for matching terms in document, push to list with location. Then, look for sequential numbers in index and pull those words out to highlight
                        if (mult_terms_stripped[j] == content_string_stripped) {                                                        
                            string_index.push(parseInt(i));
                            temp_orig_boxes.push($(this));                                                        
                        }
                    }                    
                }

                else { //single word
                    if (content_string_stripped == search_term_stripped) {
                        temp_orig_boxes.push($(this));             
                    }
                }                
            }); //closes each loop                            
                            
            if (mult_terms_status == true){                
                //find indices of sequential, pushes these from temp_orig_boxes into confirmed_orig_boxes array
                var phrase_indices = findSeq(string_index); //gets indices of sequential numbers
                if (phrase_indices == null){
                    return;
                }                                
                for (var i = 0; i < phrase_indices.length; i++){
                    for (var j = 0; j < mult_terms_stripped.length; j++){                        
                        confirmed_orig_boxes.push(temp_orig_boxes[(phrase_indices[i]+j)]);
                    }
                }
            }
            else{//copy single word temp to confirmed
                confirmed_orig_boxes = temp_orig_boxes;
            }                
            
            // create orig_boxes array from confirmed_orig_boxes array elements
            for (var i = 0; i < Object.keys(confirmed_orig_boxes).length; i++){
                var o_info = new Array(); // original dimensions and location of string relative to source image (s_info)
                // original dimensions and coordinates                                                            
                o_info['height'] = parseInt(confirmed_orig_boxes[i].attr('HEIGHT'));
                o_info['width'] = parseInt(confirmed_orig_boxes[i].attr('WIDTH'));
                o_info['vpos'] = parseInt(confirmed_orig_boxes[i].attr('VPOS'));
                o_info['hpos'] = parseInt(confirmed_orig_boxes[i].attr('HPOS'));
                orig_boxes.push(o_info);
            } 

            // XML parsing done, push ORIGINAL box dimensions to page_matches_array
            page_matches_array.push(orig_boxes);

            //create boxes - iterate through page_matches_array[2] (matches dimensions)
            for (var i=0;i<page_matches_array[2].length;i++){
                // creates fresh highlight box array for each
                var h_info = new Array(); // dimensions and coords of highlight box

                //highlight box coordinates and size
                h_info['height'] = parseInt((page_matches_array[2][i]['height'] / s_info['height']) * c_info['height']);
                h_info['width'] = parseInt((page_matches_array[2][i]['width'] / s_info['width']) * c_info['width']);
                h_info['vpos'] = parseInt((page_matches_array[2][i]['vpos'] / s_info['height']) * c_info['height']);
                h_info['hpos'] = parseInt((page_matches_array[2][i]['hpos'] / s_info['width']) * c_info['width']);
                // console.log("highlight box",h_info);

                //draw boxes where "i" is the current match number
                img_container.append("<div id='"+leaf_side+"_match_"+i+"' style='display:none;' class='image_highlight'></div>"); //number with match indices...
                $('#'+leaf_side+'_match_'+i).css({
                    'height': h_info['height'],
                    'width': h_info['width'],
                    'top': h_info['vpos'],
                    'left': h_info['hpos']
                },1000);
            }

            // Wrap elements and display           
            $('.image_highlight').fadeIn();

        }); //closes ajax "get" request                            
    } //closes 1up mode

    br.imageHighlights = true;
}

function removeImageHighlights(){
    $(".image_highlight").remove();
    $(".highlight").removeClass('highlight');
    br.imageHighlights == false;
}

function showLoading(){
    $("#overlays").append("<div id='loading_animation'></div>");
    $("#loading_animation").position({my: "right top", at: "right bottom", offset: "-5 5", of: '#WSUtoolbar'});
    $("#loading_animation").fadeIn();
}

function hideLoading(){
    $("#loading_animation").fadeOut(function(){
        $(this).remove();
    });
}

//item info and export tools
function itemInfo(){
    alert("coming soon...");
}



//////////////////////////////////////////////////////////////////////////////////////
//Utilities
//////////////////////////////////////////////////////////////////////////////////////

//Get page number(s) and layout mode    
function getPageInfo (){
    var cURL = window.location.href.split('/');
    var rootpage = parseInt(cURL[5]);
    var secondarypage = parseInt(rootpage) + 1;

    // sets mode
    if (cURL[7] == "2up") {
        var mode = "2up";    
    };
    if (cURL[7] == "1up") {
        var mode = "1up";    
    };
    if (cURL[7] == "thumb") {
        var mode = "thumb";    
    };

    return {
        "rootpage":rootpage,
        "secondarypage":secondarypage,
        "mode":mode
    }

}

// Indices Locator
function getIndicesOf(searchStr, str, caseSensitive) {
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

// simple startsWith function
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

//function to find sequential indexes - used for highlighting phrases, pass array to it
function findSeq ( arr ) {
    var diff1, diff2, result = [];

    for ( var i = 0, len = arr.length; i < len - 2; i += 1 ) {
        diff1 = arr[i] - arr[i+1];
        diff2 = arr[i+1] - arr[i+2];
        if ( Math.abs( diff1 ) === 1 && diff1 === diff2 ) {
        // if ( Math.abs( diff1 ) === 1 ) {
            result.push( i );
        }        
    }

    return result.length > 0 ? result : null;
}

//////////////////////////////////////////////////////////////////////////////////////
//Resizing
//////////////////////////////////////////////////////////////////////////////////////

//hooked into: switchMode(), zoom1up(), zoom2up(),
function stateChange(){    
    bigArrows('state_change');
    bigArrowsPulse();
}


//////////////////////////////////////////////////////////////////////////////////////
//Listeners
//////////////////////////////////////////////////////////////////////////////////////

//listens for window resizing, binds to resizeEnd trigger
$(window).resize(function() {
    if(this.resizeTO) clearTimeout(this.resizeTO);
    this.resizeTO = setTimeout(function() {
        $(this).trigger('resizeEnd');
    }, 500);
});

//redraws after resizing
$(window).bind('resizeEnd', function() {
    if (br.OCRstatus == true) {
        showOCR(); //rename to redrawOCR (and create that function)                        
    }
    if (br.fts_displayed == true) {
        var row_start = br.fts_results_row;
        getFTSResultsStatic(row_start);        
    }
    if (br.bigArrowStatus == true) {
        bigArrows('resize'); 
    }
    //this is a little buggy, you can see background images reappear while window dragging
    if (br.plainTextStatus == true){
        resizePlainText();
    }

});

//listens for rootpage change - very helpful function...
$(window).bind('hashchange', function() {    
    
    //draws highlights for new page    
    if (br.imageHighlights == true){        
        renderImageHighlights();
    }

    //REDO THIS, MESSY AFTER REORG/////////////////////////////
    //redraws OCR
    if (br.OCRstatus != false){
        singlepageOCR();        
    }

    // Reinstates OCR after page flip                
    if (br.OCRstatus == true) {                
        $('.OCR_box').remove();
        showOCR();
    }
    ///////////////////////////////////////////////////////////
});














