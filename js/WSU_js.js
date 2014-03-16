
//////////////////////////////////////////////////////////////////////////////////////
//Other Functions

//FTS search results
function getFTSResultsStatic (row_start, fts_box_mode) {

    showLoading();

    // var search_term = form.fts.value;
    var search_term = $('#fts_input').val();
    var solr_search_term = search_term.replace(/['’‘]/g,"*");

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

    // Create hidden Full-Text Search static box 
    // if (br.fts_displayed == false){
    //     $fts_static = $('<div id="fts_box_text_static" class="shadow"></div>');
    //     $('body').append($fts_static);
    // }

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

    //construct URL for Solr query
    var squery = "php/solr_XML_request.php?solr_baseURL=" + br.solr_baseURL + "&search_term=" + encodeURIComponent(solr_search_term) + "&ItemID=" + br.ItemID + "&row_start=" + row_start + "&datatype=json";
    //console.log(squery);

    //solr query
    $.ajax({          
      url: squery,      
      dataType: 'json',            
      success: FTSsearchSuccess,
      error: FTSsearchError
    });

    function FTSsearchSuccess(result) {      
        // console.log(result);
        //stop loading animation
        hideLoading();                

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

            //size fts_box_text_static appropriately and move it down (inside wrapper will still resize)
            $("#fts_box_text_static").height( $(window).height() - $("#WSUtoolbar").height() - 20 );
            $("#fts_box_text_static").css( "margin-top", $("#WSUtoolbar").height() );
            

            //create results wrapper
            $("#fts_box_text_static").append("<div id='fts_results_wrapper'></div>");            
            
            // get all highlights from page set (snippets)
            var snippets = result.highlighting;            
            var snippet_keys = Object.keys(snippets);     
            // console.log(snippet_keys);       

            //iterate through documents with matches
            for (var i = 0; i < snippet_keys.length; i++) {

                // iterate through OCR_text.Array for each snippet, grabbing the page number from the Object Key                
                for (var j = 0; j < snippets[snippet_keys[i]].OCR_text.length; j++) {
                    // console.log(snippets[snippet_keys[i]].OCR_text[j]);
                    var OCR_snippet = snippets[snippet_keys[i]].OCR_text[j];
                    // var snippet_text = '<a href="#" onclick="br.jumpToIndex('+(result.response.docs[i].page_num - 1)+');">page: <b>' + result.response.docs[i].page_num + '</a></b><br>"...' + OCR_snippet + '..."<br><br>';
                    var snippet_text = '<a href="#" onclick="mobileNavPanelDestroy(\'FTS\'); br.jumpToPage(\''+(result.response.docs[i].page_num)+'\');">page: <b>' + result.response.docs[i].page_num + '</a></b><br>"...' + OCR_snippet + '..."<br><br>';
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

            //prependÂ fts_page_nav class to top
            $('#fts_top_nav').insertAfter('#fts_terms','</br>');            
            // $('.fts_nav').append('</br></br>');            
            
            //add result sets at bottom, use "result.response.numFound"
            $('#fts_box_text_static').append('<div class="fts_set_nav shadow_top" id="fts_bottom_nav">Result sets: </div>');            
            var sets = Math.ceil(parseInt(result.response.numFound) / 10);            
            // console.log("Total found: "+result.response.numFound);
            // console.log("FTS sets: "+sets);
            for (var i = 0; i <= sets; i++){
                var set_seed = i * 10;
                // var row_set = (i*10+1) + "-" + (i*10+10) + ", ";
                var row_set = i + 1;                
                $("#fts_bottom_nav").append('<a class="fts_set" onclick="getFTSResultsStatic('+set_seed+'); return false;">'+row_set+'</a>');                
            }                                                

            // delete last comma
            var temp_str = $(".fts_set:last-child").html();
            var new_str = temp_str.substring(0, temp_str.length - 2);
            $(".fts_set:last-child").html(new_str);
          
            resizeFTSWrapper();
            
            
        }      
      } //closes success function

      function FTSsearchError(){
        alert('There was a problem with the full-text searching.');
        //stop loading animation
        hideLoading();
      }      
       
   
    //set variables
    br.fts_results_row = row_start;    
    br.search_term = search_term;

    //render results
    displayFTSResultsStatic(row_start, search_term);
}

//Display FTS results Static
function displayFTSResultsStatic(row_start, search_term, resize){

    //if mobile, small screen, drop cog and make full screen
    if (br.mobileDevice == "small_screen" && ($('#cogIcon').hasClass('extended'))) {        
        toggleMoreTools();
    }

    //draw and position search results
    var fts_handle_static = $('#fts_box_text_static');

    //create buttons for closing and pop-out
    fts_handle_static.prepend("<div class='icon tools right' id='fts_static_tools'></div>");
    $('#fts_static_tools').append('<ul class="the-icons" id="fts_icons_list"><li><span style="font-size:1.5em; font-weight:bold;">Full-Text Search Results</span></li></ul>');
    $('#fts_icons_list').append('<li><i class="icon-remove mobHandle" onclick="hideFTSResultsStatic(); return false;"></i></li><li><i id="fts_accordian" class="mobHandle icon-chevron-left" onclick="accordFTSResultsStatic(); return false;"></i></li>'); 

    //display if not already drawn, and resize fts_wrapper when animation complete
    if (br.fts_displayed === false){    
        fts_handle_static.fadeIn(function(){
            resizeFTSWrapper();
        });
    }
    else{
        //size fts_box_text_static appropriately and move it down (inside wrapper will still resize)
        $("#fts_box_text_static").height( $(window).height() - $("#WSUtoolbar").height() -20 );
        $("#fts_box_text_static").css( "margin-top", $("#WSUtoolbar").height() );        
        resizeFTSWrapper();
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

    //set variables
    br.fts_displayed = true;    
    return false;
}

function resizeFTSWrapper(){
        $("#fts_box_text_static").ready(function(){
            var newHeight = $("#fts_box_text_static").height() - ($("#fts_static_tools").height() + $("#fts_terms").height() + $("#fts_top_nav").height() + $("#fts_bottom_nav").height() + 85);
            $("#fts_results_wrapper").height(newHeight);            
        });        
}

//Hide FTS results Static
function hideFTSResultsStatic(){
    $('#fts_box_text_static').fadeOut("normal", function() {
        $(this).empty();
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
        //set return width
        br.ftsWidth = $('#fts_box_text_static').width();

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
        $('#fts_box_text_static').animate({
            width:br.ftsWidth
        },500,function(){
            $('#fts_box_text_static').children().show();
            $('#fts_static_tools span').show();
        });        
        
        $('#fts_accordian').removeClass('icon-chevron-right').addClass('icon-chevron-left');
        br.fts_accord = "expanded";
        return
    }
}

//Text Navigation
function textNav(){    
    if (br.textNav === false) {

        br.textNav = true;

        //look for TOC datastream    
        var tocURL = "php/fedora_XML_request.php?datatype=xml2json&PIDsafe=wayne:"+br.PIDsafeID+"&datastream=TOC";

	function tocSuccess(response){
            // console.log(response);        
            if (response === false){                
                // add lightbox error
                var itemTOC = document.createElement('div');
                itemTOC.setAttribute('id','itemTOC');
                var JTPstring = "<form action='javascript:' onsubmit='br.jumpToPage(this.elements[0].value)'><span>or Jump to Page: </span><input id='BRpagenum' type='text' size='3' onfocus='br.autoStop();'/></form>";
                $(itemTOC).append('<h4>"Jump to Section" for this text is unavailable.</h4><div><p>Consider using <a href="#" onclick="launchThumbs(); return false;">Thumbnail Mode <i id="thumbs_icon" class="icon-th"/></a> as an alternative.</p></div>');
                itemTOC.setAttribute('style','max-height:50px;');
                $("#itemTOC").css('min-height','');
                //create box with item HTML block        
                $.colorbox({html:itemTOC});
                return;
            }
            else{            
                populateTextNav(response);
            }
        }
        function tocError(response){
            console.log(response);
        }    

        $.ajax({          
          url: tocURL,      
          dataType: 'json',            
          success: tocSuccess,
          error: tocError
        });

        

        //populate
        function populateTextNav(response){
            // console.log(response);
            var text_nav = $('#text_nav'); 

            //create buttons for closing and pop-out
            text_nav.prepend("<div class='icon tools right' id='text_nav_static_tools'></div>");
            $('#text_nav_static_tools').append('<ul class="the-icons" id="text_nav_icons_list"><li><span style="font-size:1.5em; font-weight:bold;">Jump to Section</span></li></ul>');
            $('#text_nav_icons_list').append('<li><i class="icon-remove mobHandle" onclick="hideTextNav(); return false;"></i>');
            
            //iterate through "sections"        
            text_nav.append("<ul id='nav_sections'></ul>");
            //front / cover
            $("#nav_sections").append("<li><a href='#' onclick='br.leftmost();'><strong>Front Cover</strong></a></li></br>");
            //sections
            for (var i = 0; i < response.section.length; i++) {

                //check for section heading                
                if (typeof response.section[i].orig_page.length === 'undefined'){
                    //print section heading
                    $("#nav_sections").append("<li class='section'><a href='#' onclick='mobileNavPanelDestroy(\"text_nav\"); br.jumpToPage(\""+response.section[i].image_page+"\");'><strong>"+response.section[i].name+"</strong></a></li>");
                    //get sub-sections
                    for (var j = 0; response.section[i].section.length > j; j++){
                        $("#nav_sections").append("<li class='sub_section'><a href='#' onclick='mobileNavPanelDestroy(\"text_nav\"); br.jumpToPage(\""+response.section[i].section[j].image_page+"\");'>"+response.section[i].section[j].name+"<span class='right'>"+response.section[i].section[j].orig_page+"</span></a></li>");
                    }                   
                }

                else{
                    //append section w/ page
                    $("#nav_sections").append("<li class='section'><a href='#' onclick='mobileNavPanelDestroy(\"text_nav\"); br.jumpToPage(\""+response.section[i].image_page+"\");'>"+response.section[i].name+"<span class='right'>"+response.section[i].orig_page+"</span></a></li>");
                }
            }
            //End / Back Cover
            $("#nav_sections").append("</br><li><a href='#' onclick='br.rightmost();'><strong>Back Cover</strong></a></li>");                


            //resize
            text_nav.height( $(window).height() - $("#WSUtoolbar").height() -20 );
            text_nav.css( "margin-top", $("#WSUtoolbar").height() ); 


            text_nav.fadeIn(function(){
                resizeTextNav();
            });
        }
    }

    else if (br.textNav === true) {        
        hideTextNav();        
    }    

}

function resizeTextNav(){
        $("#text_nav").ready(function(){
            var newHeight = $("#text_nav").height() - ($("#text_struct").height() + 50);                       
            $("#nav_sections").height(newHeight);            
        });


}

//Hide FTS results Static
function hideTextNav(){
    $('#text_nav').fadeOut("normal", function() {
        $(this).empty();
    });
    if (br.plainTextStatus == true) {
        $('#html_concat').css('margin','auto');
        $('#html_concat').width($(window).width() - 40)
    }
    //set status
    br.textNav = false;
}


// OCR overlays
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

            // // convert ItemID to PIDsafe
            // var PIDsafe = br.ItemID.replace(/_/g,"");

            //page URL's
            var leftOCR_URL = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':HTML&datastream=HTML_'+(rootpage).toString();
            var rightOCR_URL = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':HTML&datastream=HTML_'+(secondarypage).toString();            
            
            $(document).ready(function(){
                $.ajax({
                    type: "GET",
                    url: leftOCR_URL,
                    dataType: "html",
                    success: paintOCR_left
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
                                function paintOCR_right(html){                
                                    $('#BRtwopageview').append("<div class='OCR_box right pbox_border OCR_shadow'><div class='OCR_box_text OCR_right'></div></div>");
                                    $('.OCR_box.right .OCR_box_text').append(html);
                                    // alert('here I am');
                                    fontNormalize(); //increases font size two steps
                                    $('.OCR_box').fadeIn();                                    
                                }
                            });                                        
                        }

                    //only runs if cover or back
                    $('.OCR_box').fadeIn();
                    }

                    
            });

        } 

        //1up mode --> call singlepageOCR()
        else if (mode == "1up"){            
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
    // var PIDsafe = br.ItemID.replace(/_/g,"");

    //page URL
    var leftOCR_URL = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':HTML&datastream=HTML_'+(rootpage).toString();

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
        
        fontNormalize();
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
            $("#second_row").css('padding-left','72px');
            $('.OCR_tools').fadeOut();
            $('.toggleOCR').css("border", "none");
            br.plainOCRstatus = false;            
        }
        else{
            $("#second_row").css('padding-left','0px');            
            $('.OCR_tools').fadeIn();            
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
            $("#second_row").css('padding-left','0px');
            $('.OCR_tools').fadeIn();            
            $('.toggleOCR').addClass("active_icon");
            return;
        }    
        if (br.OCRstatus == true){
            hideOCR();
            // hide OCR tools
            $("#second_row").css('padding-left','72px');
            $('.OCR_tools').fadeOut();
            // $('.toggleOCR').css("border", "none");
            $('.toggleOCR').removeClass("active_icon");
            return;
        }
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

function fontNormalize(){
    // alert('about to run!');
    fontResize('increase');
    fontResize('increase');
}

// read pages aloud
function speakPageAloud(source) {
     
    //if playing, then stop
    if ( $(".icon-speaker").hasClass('playing') ){
        sayItstop();
    }    

    //if not playing, start
    else{
            //say loading
            var playerDivId = "jplayer_box";
            var say = function() {
                var playerDiv = $("<div style='width: 0px; height: 0px;' id='" + playerDivId + "'></div>");
                var bodyObject = $("body");
                if (bodyObject.size()) {
                bodyObject.append(playerDiv);
                playerDiv.jPlayer({
                ready: function () {          
                  $(this).jPlayer("setMedia", {"mp3": "inc/audio_loading.mp3"}).jPlayer("play");      
                }
                ,
                ended: function (){              
                    $("#jplayer_box").remove();
                    speakText();              
                }
                });    
                } else {
                    alert("No <body> node to attach to.");
                }
            };
        say();
        function speakText(){
            var $current_layout = getPageInfo();
            //solr query for text
            var squery = 'http://localhost/solr4/bookreader/select/?q=page_num:%5b'+$current_layout.rootpage+'%20TO%20'+$current_layout.secondarypage+'%5d&fq=ItemID:'+br.ItemID+'&wt=json';
            // console.log(squery);
            //1up or 2up mode, using PHP tunnel
            var data = new Object();
            data.squery = squery;
            $.ajax({          
              url: "php/solr_speak_XML_request.php?squery="+squery,
              dataType: 'json',
              data:data,
              // jsonpCallback: 'callback',
              success: function(result) {
                // console.log(result);
                if ($current_layout.mode == "1up") { 
                    var Singletext = result.response.docs[0].OCR_text;
                    var Speaktext = "Single Page - "+Singletext;
                    sayIt("page_text","null","null",Speaktext);
                }
                if ($current_layout.mode == "2up") {
                    var Ltext = result.response.docs[0].OCR_text;
                    var Rtext = result.response.docs[1].OCR_text;
                    var Speaktext = "Left page - "+Ltext+"- Right page - "+Rtext;
                    sayIt("page_text",Ltext,Rtext,Speaktext);        
                }       
              }
            });
        }
    }

    //toggles color of icon and status
    $(".icon-speaker").toggleClass("active_icon playing");  
    
}

//speak words
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
            br.right("speak_src"); //sends "speak_src" parameter to flipper, contidional runs "speakPageAloud"
            speakPageAloud('autoflip');
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

// flip navigation arrows for 1up / 2up (remove in thumbs?)
function arrowsFlip (new_mode) {    
    if (new_mode == '1up'){        
        $('#previousArrow').removeClass('icon-arrow-left').addClass('icon-arrow-up');
        $('#nextArrow').removeClass('icon-arrow-right').addClass('icon-arrow-down');        
    }
    if (new_mode == '2up'){        
        $('#previousArrow').removeClass('icon-arrow-up').addClass('icon-arrow-left');
        $('#nextArrow').removeClass('icon-arrow-down').addClass('icon-arrow-right');
    }
    
}

// suite of functions to launch different modes from bookreader.html buttons, as a conditional for coming from thumbnail mode
function launch1up (){

    //highlight icon
    $("#mode_icons>li>i").removeClass("active_icon");
    $("#1up_icon").toggleClass('active_icon');

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
    //highlight icon
    $("#mode_icons>li>i").removeClass("active_icon");
    $("#2up_icon").toggleClass('active_icon');

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
    //highlight icon
    $("#mode_icons>li>i").removeClass("active_icon");
    $("#thumbs_icon").addClass('active_icon');

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
        $(mag_select).loupe({
            width: 225, // width of magnifier
            height: 175, // height of magnifier
            loupe: 'loupe' // css class for magnifier
        });
        $(mag_select).data('loupe', true);

        //sets status after 250 milliseconds, allows loupe to be created before click would have detroyed it
        setTimeout(function() {br.loupe_status = true;}, 250);        
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

function toolbarsMinimize(){   

    var $current_layout = getPageInfo();

    if ($('#WSUtoolbar_minimize').hasClass('toolbar_exposed')) {      
        
        //get current distance from top, will return to this
        br.minimizerD = $("#WSUtoolbar_minimize").css('top');

        $('#WSUtoolbar').slideUp(br.toolbarAnimate);
        $('#WSUtoolbar_minimize').animate({top:'0px'},{
            duration: br.toolbarAnimate,
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

        //extend plain text / HTML
        if (br.plainTextStatus == true){            
            $("#html_concat").css({
                'height':'100%',
                'margin-top':'0px'
            });

        }
    }

    else {
        $('#WSUtoolbar').slideDown(br.toolbarAnimate, function(){            
            $("#BRcontainer").css({ top:$("#WSUtoolbar").height() }); //this needs to change based on screen size we're in...
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
            //retract plain text / HTML
            if (br.plainTextStatus == true){            
                $("#html_concat").css({
                    'height': ($(window).height() - $("#WSUtoolbar").height()),
                    'margin-top': $("#WSUtoolbar").height()
                });
            }
        });

        $('#WSUtoolbar_minimize').animate({top:br.minimizerD},br.toolbarAnimate, function(){
            $(this).removeAttr('style');
        });        

        $('#WSUtoolbar_minimize').addClass('toolbar_exposed').removeClass('toolbar_hidden');
        $("#minimize_handle").removeClass('icon-chevron-down').addClass('icon-chevron-up');
                       
    }
}

function plainText(){

    var $current_layout = getPageInfo();    

    //turn on
    if (br.plainTextStatus == false){

        $("#mode_icons>li>i").removeClass("active_icon");
        $("#plain_text_icon").toggleClass("active_icon");

        //hide OCR overlay button, reveal text-sizing
        if (br.OCRstatus == true){
            if (br.mode !== 3){
                $(".toggleOCR").toggle();
            }
        }
        else{
            if (br.mode !== 3){
                $(".toggleOCR").toggle();
            }
            $(".OCR_tools").toggle();
        }
        

        showLoading();        

        //2up
        if ($current_layout.mode == '2up'){            
            // 2up
            $("#BRtwopageview").hide();            
        }
        //1up
        if ($current_layout.mode == '1up' || 'thumb'){            
            $("#BRpageview").hide();            
        }       

        //after conditionals, if still proceeding, show loading message and set status to true
        br.plainTextStatus = true;                

        //insert HTML and resize        
        $('#BookReader').append("<div id='html_concat' ></div>");        
        $('#html_concat').hide();            
        $('#html_concat').height(($(window).height() - $("#WSUtoolbar").height()) );        
        $('#html_concat').css('margin-top',$("#WSUtoolbar").height());


        //resizes plain text if FTS is true
        if (br.fts_displayed == true){            
            $('#html_concat').css('margin-left','325px');
            $('#html_concat').width($(window).width() - 365)            
        }
        else{
            $('#html_concat').width($(window).width() - 55)
        }

        // Load fullbook HTML
        var html_concat = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':fullbook&datastream=HTML_FULL';
        // console.log(html_concat);            
            
        $(document).ready(function(){
            $.ajax({
                type: "GET",
                url: html_concat,
                dataType: "html",
                success: plainTextSuccess,
                error: plainTextError
            });


            function plainTextSuccess(response){            
                $('#html_concat').html(response);
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
                    $(this).prepend('<a class="leaf_num" href="#" onclick="br.jumpToIndex('+page_num+');">Page '+page_num+'</a>');
                });

                // highlights br.search_term if active
                if(br.fts_displayed == true){
                    renderPlainTextHighlights();
                }

                //increase font size two steps
                fontNormalize();

                //remove loading and set BR mode        
                hideLoading();
                // return;
            }

            function plainTextError(){
                //remove loading and set BR mode        
                hideLoading();
            }

            });        

        // if FTS true, show highlights
        if (br.fts_displayed == true){                 
            renderPlainTextHighlights();
        }
        
        $('#html_concat').fadeIn();        
    }

    //remove plainText
    else { 

        //hide OCR overlay button, reveal text-sizing
        if (br.OCRstatus == true){
            if (br.mode !== 3){
                $(".toggleOCR").toggle();
            }
        }
        else{
            if (br.mode !== 3){
                $(".toggleOCR").toggle();
            }
            $(".OCR_tools").toggle();
        }      

        $("#plain_text_icon").toggleClass("active_icon");
        //indicate launched book mode
        if (br.mode == 1){
            $("#mode_icons>li>i").removeClass("active_icon");
            $("#1up_icon").toggleClass('active_icon');
        }
        if (br.mode == 2){
            $("#mode_icons>li>i").removeClass("active_icon");
            $("#2up_icon").toggleClass('active_icon');
        }
        if (br.mode == 3){
            $("#mode_icons>li>i").removeClass("active_icon");
            $("#thumbs_icon").toggleClass('active_icon');
        }        

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
            $("#BRpageview").fadeIn();            
        }

        removePlainTextHighlights();
        br.jumpToIndex(parseInt(seg_locale));                
        return;
    }    
}

function resizePlainText(trigger){

    //height
    if (br.plainTextStatus == true){
        $("#html_concat").css({
            'height': ($(window).height() - $("#WSUtoolbar").height()),
            'margin-top': $("#WSUtoolbar").height()
        });
    }
    //width
    if (br.fts_displayed == true){            
        $('#html_concat').css('margin-left','325px');
        $('#html_concat').width($(window).width() - 365)            
    }
    else{
        $('#html_concat').width($(window).width() - 40)
    }

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

    //prevents highlighting when OCR is down
    if (br.OCRstatus == true){
        return;
    }    

    $current_layout = getPageInfo();
    if ($current_layout.mode == undefined){        
        return;
    }       

    //clear previous
    $(".image_highlight").remove();   

    // 2up
    if ($current_layout.mode == "2up") {

        //create URLs
        var left_xml_doc = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':altoXML&datastream=altoXML_'+$current_layout.rootpage.toString()+'&datatype=html';
        var right_xml_doc = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':altoXML&datastream=altoXML_'+$current_layout.secondarypage.toString()+'&datatype=html';

        drawBoxes($current_layout.mode, $current_layout.rootpage, left_xml_doc,br.search_term,'l');
        drawBoxes($current_layout.mode, $current_layout.secondarypage, right_xml_doc,br.search_term,'r');
    }

    // 1up
    if ($current_layout.mode == "1up") {                    

        //create URLs
        var single_current_xml_doc = 'php/fedora_XML_request.php?PIDsafe='+br.PIDsafeID+':altoXML&datastream=altoXML_'+$current_layout.rootpage.toString()+'&datatype=html';        
        drawBoxes($current_layout.mode, $current_layout.rootpage, single_current_xml_doc, br.search_term,'single'); //current page        
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
                // console.log(phrase_indices);
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

    //conditional for no information
    if (br.bookMetaObj == false){
        var itemMeta = document.createElement('div');
        itemMeta.setAttribute('id','itemMeta');
        $(itemMeta).append("<h4>Metadata for this text is unavailable.</h4>");
        itemMeta.setAttribute('style','max-height:50px;');
        $("#itemMeta").css('min-height','');

    }
    
    else{
        //write metadata to HTML block  
        var itemMeta = document.createElement('div');
        itemMeta.setAttribute('id','itemMeta');

        //cover image
        var coverURL = br.baseURL+'fedora/objects/'+br.PIDsafeID+':thumbs/datastreams/THUMB_1/content';
        $(itemMeta).append("<div id='itemMeta_top'><img src='"+coverURL+"'/></div>");    

        //METADATA
        //Book Title - usually [0] of titleInfo
        if (br.bookMetaObj.titleInfo.length != undefined){
            var mainTitle = br.bookMetaObj.titleInfo[0].title;
        }
        else {
            var mainTitle = br.bookMetaObj.titleInfo.title;
        }
        $(itemMeta).append("<h2><strong>Title:</strong> "+mainTitle+"</h2>");

        //author
        var bookAuthors = [];        
        //multiple authors        
        if (br.bookMetaObj.name.length != undefined ){
            for(var i = 0; i < br.bookMetaObj.name.length; i++){                
                //if includes date in namePart
                if (toType(br.bookMetaObj.name[i].namePart) === "array"){                    
                    bookAuthors.push(br.bookMetaObj.name[i].namePart[0]);
                }
                //just a name
                else {                    
                    bookAuthors.push(br.bookMetaObj.name[i].namePart);                    
                }
            }
        }

        //one author
        else {
            //if includes date in namePart
            if (toType(br.bookMetaObj.name.namePart) === "array"){                
                bookAuthors.push(br.bookMetaObj.name.namePart[0]);
            }
            //just a name
            else {
                bookAuthors.push(br.bookMetaObj.name.namePart);
            }
            
        }
        //console.log(bookAuthors);
        //iterate through all authors
        for(var i = 0; i < bookAuthors.length; i++){
            $(itemMeta).append("<span class='info_span'><strong>Author:</strong> "+bookAuthors[i]+"</br>");
        }

        //publisher
        $(itemMeta).append("<strong>Publication Info:</strong> "+br.bookMetaObj.originInfo.place[1].placeTerm+", "+br.bookMetaObj.originInfo.publisher+", "+br.bookMetaObj.originInfo.dateIssued+"</br>");

        //properties
        $(itemMeta).append("<strong>Physical Description:</strong> "+br.bookMetaObj.physicalDescription.extent+", "+br.bookMetaObj.physicalDescription.form)+"</span>";        

        //citation & persistent links
        if (typeof(br.bookMetaObj.identifier) == "object"){
            for(var i = 0; i < br.bookMetaObj.identifier.length; i++){
                if (br.bookMetaObj.identifier[i].startsWith('b')){
                    var BIBnum = br.bookMetaObj.identifier[i];
                    BIBnum = BIBnum.substring(0, BIBnum.length - 1);
                    var BIBbase = "http://elibrary.wayne.edu/record=[BIBNUM]"
                    var BIBurl = BIBbase.replace('[BIBNUM]',BIBnum);
                    $(itemMeta).append("<p><a href='"+BIBurl+"' target='_blank'>Persistent Link</a></p>");        
                }
                else{
                    //citation link                
                    var OCLCnum = br.bookMetaObj.identifier[i];
                    // var OCLCnum = br.bookMetaObj.recordInfo.recordIdentifier.split('ocn')[1];
                    var OCLCbase = "http://wild.worldcat.org/oclc/[OCLCNUM]?page=citation";
                    var OCLCurl = OCLCbase.replace('[OCLCNUM]',OCLCnum);
                    $(itemMeta).append("<p><a href='"+OCLCurl+"' target='_blank'>Cite This</a></p>");   
                }
            }
        }
        else{
            if (br.bookMetaObj.identifier.startsWith('b')){
                var BIBnum = br.bookMetaObj.identifier;
                BIBnum = BIBnum.substring(0, BIBnum.length - 1);
                var BIBbase = "http://elibrary.wayne.edu/record=[BIBNUM]"
                var BIBurl = BIBbase.replace('[BIBNUM]',BIBnum);
                $(itemMeta).append("<p><a href='"+BIBurl+"' target='_blank'>Persistent Link</a></p>");        
            }
            else{
                //citation link                
                var OCLCnum = br.bookMetaObj.identifier;
                // var OCLCnum = br.bookMetaObj.recordInfo.recordIdentifier.split('ocn')[1];
                var OCLCbase = "http://wild.worldcat.org/oclc/[OCLCNUM]?page=citation";
                var OCLCurl = OCLCbase.replace('[OCLCNUM]',OCLCnum);
                $(itemMeta).append("<p><a href='"+OCLCurl+"' target='_blank'>Cite This</a></p>");   
            }
        }

        //Notes
        if (br.bookMetaObj.note != undefined ){
            $(itemMeta).append("<strong>Notes:</strong> "+br.bookMetaObj.note+"</br>");
        }
            
        
    }

    //create box with item HTML block        
    $.colorbox({html:itemMeta});

}

function help_eTextReader(){

    //determine initial width of box
    if ( $(window).width() > 1300 ){
        helpWidth = "50%";
    }
    else {
        helpWidth = "90%";
    }

    var helpBox = document.createElement('div');
    helpBox.setAttribute('id','helpBox');
    $(helpBox).append("<div id='helpBox_content'></div>");
    $(helpBox).load("inc/views/helpBox.htm", function(){
        //create box with item HTML block        
        $.colorbox({
            html:helpBox,
            maxWidth:helpWidth,
            onComplete: function(){
                //alternate table colors
                $("#help_table tr:even").css("background-color","rgba(160,160,160,.25)");
            }
        });    
    });   
    
}

function toggleMoreTools(){
    
    //toggle rows
    $(".collapseRow").toggle();    

    //toggle height
    if (!($('#cogIcon').hasClass('extended'))) {
        $('#WSUtoolbar').height(200);
        $("#fts_box_text_static, #text_nav").css('margin-top','200px');        
    }
    if ($('#cogIcon').hasClass('extended')) {
        $('#WSUtoolbar').height(50);
        $("#fts_box_text_static, #text_nav").css('margin-top','50px');        
    }

    if (br.plainTextStatus == true){
        $("#html_concat").css({
            'height': ($(window).height() - $("#WSUtoolbar").height()),
            'margin-top': $("#WSUtoolbar").height()
        });
    }    

    //toggle class
    $('#cogIcon').toggleClass('extended');    

}

function mobileNavPanelDestroy(type){    
    if (type === "FTS" && br.mobileStatus == "true" && br.mobileDevice == 'small_screen'){
    // if (type === "FTS" && $(window).width() < 768){        
        hideFTSResultsStatic();
    }
    if (type === "text_nav" && br.mobileStatus == "true" && br.mobileDevice == 'small_screen'){
    // if (type === "text_nav" && $(window).width() < 768){
        hideTextNav();        
    }
}

//////////////////////////////////////////////////////////////////////////////////////
//Utilities
//////////////////////////////////////////////////////////////////////////////////////

// Once calculated by URL hash, now pulling internally from IA-JS
function getPageInfo (){
    var rootpage = br.currentIndex() + 1;
    var secondarypage = rootpage + 1;
    if (br.mode == "1") {
        var mode = "1up";    
    };
    if (br.mode == "2") {
        var mode = "2up";    
    };
    if (br.mode == "3") {
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

function getURLParam(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );        
}

//startsWith function for strings
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

//funciton to return variable type
var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

//////////////////////////////////////////////////////////////////////////////////////
//Resizing
//////////////////////////////////////////////////////////////////////////////////////
//hooked into: switchMode(), zoom1up(), zoom2up(),
function stateChange(){    
    if (br.mobileStatus != "true"){
        if (br.mode === 3){
            $(".toggleOCR").hide();
        }
        if (br.mode !== 3){
            $(".toggleOCR").show();
        }
    }
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

    if (br.fts_displayed == true && br.mobileStatus != "true") {                    
        $("#fts_box_text_static").height( $(window).height() - $("#WSUtoolbar").height() - 20 );            
        $("#fts_box_text_static").css( "margin-top", $("#WSUtoolbar").height() );        
        resizeFTSWrapper();
    }

    if (br.textNav == true){
        $("#text_nav").height( $(window).height() - $("#WSUtoolbar").height() -20 );
        $("#text_nav").css( "margin-top", $("#WSUtoolbar").height() );
        resizeTextNav();
    }  
    
    //this is a little buggy, you can see background images reappear while window dragging
    if (br.plainTextStatus == true){
        resizePlainText();
    }

    //undo properties from small phone styling
    if ($(window).width() > 768){
        $("#WSUtoolbar").removeAttr('style');
        $(".collapseRow").removeAttr('style');
        
        // check toggle status
        if ($(".collapseRow").is(":hidden")) {
            $(".collapseRow").toggle();            
        }
        $("#cogIcon").removeClass('extended');

        //FTS
        if ( br.fts_displayed == true ){
            $("#fts_box_text_static").height( $(window).height() - $("#WSUtoolbar").height() - 20 );            
            $("#fts_box_text_static").css( "margin-top", $("#WSUtoolbar").height() );        
            resizeFTSWrapper();            
            $("#fts_box_text_static").fadeIn();
        }
        //text_nav
        if (br.textNav == true){
            $("#text_nav").height( $(window).height() - $("#WSUtoolbar").height() -20 );
            $("#text_nav").css( "margin-top", $("#WSUtoolbar").height() );
            resizeTextNav();
            // $("#text_nav").fadeIn();
        }
    }    

});

//listens for rootpage change - very helpful function...
$(window).bind('hashchange', function() {
    //draws highlights for new page    
    if (br.imageHighlights == true){        
        renderImageHighlights();
    }
    
    //redraws OCR for 1up
    if (br.OCRstatus != false && br.mode == 1){        
        singlepageOCR();        
    }

    //redraws OCR for 2up
    if (br.OCRstatus == true && br.mode == 2) {        
        $('.OCR_box').remove();
        showOCR();
    }    

    //changes active mode if coming from thumbs
    if (br.lastReadingMode === 3){
        //highlight icon
        $("#mode_icons>li>i").removeClass("active_icon");
        $("#"+br.mode+"up_icon").toggleClass('active_icon');
    }

});

//binds Escape to overlay destructions
$(document).keyup(function(e){
    if(e.keyCode === 27 && br.loupe_status == true){
        magLoupe();
    }
    if(e.keyCode === 27 && br.OCRstatus == true){
        toggleOCR();
    }
});

//listens for mouse click anywhere, destroy magLoupe if present
$(document).click(function(e) {     
    if (br.loupe_status == true){        
        magLoupe();        
    }    
});













