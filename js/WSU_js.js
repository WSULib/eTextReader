//////////////////////////////////////////////////////////////////////////////////////
//Postlaunch operations
function postLaunch() {
//////////////////////////////////////////////////////////////////////////////////////

    //Create hidden Full-Text Search dialog    
    $(document).ready(function() {
        $fts_dialog = $('<div id="fts_box_text"></div>')            
            .dialog({
                autoOpen: false,
                title: 'Full-Text Search Results',
                autoResize: 'true'
            });                   
    });      

    //create minimize arrow
    $('#BookReader').append('<div id="WSUtoolbar_minimize" class="WSUdn" onclick="toolbarsMinimize(); return false;"" title="Show/hide nav bar">v</div>');
    

    //set OCR status
    br.OCRstatus = false;   

    //create large navigation arrows - 2 second bold to show user they are there
    bigArrows();
    bigArrowsPulse();
                    
                   



} //closes postLaunch()



//////////////////////////////////////////////////////////////////////////////////////
//Other Functions
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

//FTS search results
function getFTSResultsStatic (row_start, fts_box_mode) {

    //expands FTS results if collapsed
    var fts_accord = br.fts_accord;
    if (fts_accord == "collapsed") {
        accordFTSResultsStatic();
    }

    //Create hidden Full-Text Search static box
    $fts_static = $('<div id="fts_box_text_static" class="shadow"></div>');
    $('body').append($fts_static);

    //clear previous results            
    $("#fts_box_text_static").html('<hr><p id="fts_terms"></p>');    

    // var search_term = form.fts.value;
    var search_term = $('#fts_input').val();
    var squery = 'http://141.217.97.167:8080/solr/bookreader/select/?q=OCR_text:'+search_term+'&fq=ItemID:'+ItemID+'&sort=page_num%20asc&start='+row_start+'&rows=10&indent=on&wt=json&json.wrf=callback';    

    //pagination counters
    var prev = row_start - 10;
    var next = row_start + 10;

    //function for checking odd or even (leaf side)
    function isEven(value) {
    return (value%2 == 0);
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
            NewDiv.innerHTML = '<div><p>Found no results.</p></div>';
            Parent.appendChild(NewDiv);            
        }

        else {

            //set counter for alternating background color
            counter = 0;

            $('#fts_terms').html('Search results for: "<span class="fts_highlight">' + search_term + '</span>"');
            $('#fts_terms').append('<div id="fts_counts"></div>');            
            $('#fts_counts').append('Found on '+result.response.numFound+' pages.</br>');
            if (next < result.response.numFound){
                $('#fts_counts').append('Displaying results: '+(row_start + 1)+' - '+(row_start + 10));
            }
            else {
                $('#fts_counts').append('Displaying pages '+(row_start + 1)+' - '+result.response.numFound);    
            }

            for (var i = 0; i < result.response.docs.length; i++) { 
                
                //same for all instances in one page
                var ftsURL = cURL.replace(/(.*?page\/).*?(\/.+?\/).*/, "$1" + result.response.docs[i].page_num + "$2");                
                var page_text = result.response.docs[i].OCR_text.toString();                 

                // grab OCR snippet                
                // More difficult than originally thought.  The current setup returns only the first match for a given page of OCR text. We want every instance within a page.                
                // The following function produces the indices of all occurences of the search term on a page.  
                // Iterate over these instances as the OCR snippet each time.

                // INDICES LOCATOR /////////////////////////////////////////////////////////////////////////
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

                search_term = search_term.replace(/["']/g, "");
                var term_indices = getIndicesOf(search_term, page_text, false);                                
                // INDICES LOCATOR /////////////////////////////////////////////////////////////////////////

                //Itereate through the indices and display results
                for (var instance_counter = 0; instance_counter < term_indices.length; instance_counter++) {
                    var search_loc = term_indices[instance_counter]; //search_term location

                    if (page_text.length < 80) {
                        var snippet_start = 0;
                        var snippet_end = page_text.length;   
                    }

                    else {
                        //determine start location
                        if (search_loc - search_term.length <= 30 ){
                            var snippet_start = 0;
                        }
                        else {
                            var snippet_start = search_loc - 30;  
                        }              
                        
                        // determine end location
                        if (search_loc + search_term.length >= page_text.length - 50){
                            var snippet_end = page_text.length;
                        }
                        else {
                            var snippet_end = search_loc + search_term.length + 50;                
                        }
                    }                    

                    // alert(ftsURL);
                    // alert(snippet_start);
                    // alert(snippet_end);

                    //create snippet and append to page DOM             
                    OCR_snippet = page_text.slice(snippet_start,snippet_end).replace(search_term,'<span class="fts_highlight">'+search_term+'</span style="background-color:pink;">');
                    var thisResult = '<a href="' + ftsURL + '">page: <b>' + result.response.docs[i].page_num + '</a></b><br>"...' + OCR_snippet + '..."<br><br>';
                    $('#fts_box_text_static').append('<div class="fts_result" id="fts_result_'+counter+'"></div>');                
                    $("#fts_result_"+counter).html(thisResult);
                    if (counter % 2 === 0){
                      $("#fts_result_"+counter).addClass('osc_dark');
                    }               

                    //bump alternating background calss counter
                    counter++;
                } //closes iterations through page instances
            } //closes page iteration

            //add pagination navigation
            $('#fts_box_text_static').append('<div class="fts_nav"></div>');
            if (row_start == 0 && result.response.numFound < 10){                
                return;
            }

            else if (row_start == 0 && result.response.numFound > 10){            
                $('.fts_nav').append('<a class="fts_page_nav fts_next" onclick="getFTSResultsStatic('+next+'); return false;">Next 10</a>');
            }           
                    
            else {                
                if (next < result.response.numFound) {
                    $('.fts_nav').append('<a class="fts_page_nav fts_next" onclick="getFTSResultsStatic('+next+'); return false;">/ Next 10</a>');
                }
                $('.fts_nav').append('<a class="fts_page_nav fts_previous" onclick="getFTSResultsStatic('+prev+'); return false;">Previous 10</a>');
            }

            //prepend  fts_page_nav class to top
            $('.fts_nav').clone().insertAfter('#fts_terms','</br>');
            $('.fts_nav').append('</br></br>');
            $('.fts_page_nav').css('color','#00594d');
        }
        
      }
    });    
   
    br.fts_results_row = row_start;
    displayFTSResultsStatic(row_start, search_term);   

}

//Display FTS results Static
function displayFTSResultsStatic(row_start, search_term){
    var fts_handle_static = $('#fts_box_text_static');                                        
    fts_handle_static.position({my: "left top", at: "left bottom", offset: "0 0", of: '#WSUtoolbar'});
    $('#fts_box_text_static').height($('#BRcontainer').height() - 82);

    //create buttons for closing and pop-out
    fts_handle_static.prepend("<div class='icon tools right' id='fts_static_tools'></div>");
    $('#fts_static_tools').append("<span style='font-size:1.5em; font-weight:bold;'>Full-Text Search Results</span>");    
    var func_call = "getFTSResultsDialog("+row_start+",'"+search_term+"')";
    $('#fts_static_tools').prepend('<button class="right fts_popout tool_icon rollover" type="button" onclick="'+func_call+'"; return false;"></button>');
    $('#fts_static_tools').prepend('<button class="right fts_close tool_icon rollover" type="button" onclick="hideFTSResultsStatic(); return false;"></button>');    

    // slap accordian button on the right side of results box
    $('#fts_static_tools').prepend('<button id="fts_accordian" class="right fts_collapse tool_icon rollover" type="button" onclick="accordFTSResultsStatic(); return false;"></button>');

    //display
    fts_handle_static.fadeIn();

    //set variables
    br.fts_displayed = true;
    return false;
}

//Hide FTS results Static
function hideFTSResultsStatic(){
    $('#fts_box_text_static').fadeOut("normal", function() {
        $(this).remove();
    });
    br.fts_displayed = false;
}

//Collapse FTS results Static
function accordFTSResultsStatic() {
    var fts_accord = br.fts_accord; //localize global variable, why necessary for if conditionals?

    if (fts_accord == "expanded" ){
        $('#fts_box_text_static').animate({
            width:24,
        },500);
        $('#fts_box_text_static').children().hide();
        $('#fts_static_tools').show();
        $('#fts_static_tools span').hide();
        $('#fts_accordian').removeClass('fts_collapse').addClass('fts_expand');
        br.fts_accord = "collapsed";
        return
    }
    if (fts_accord == "collapsed") {
        $('#fts_box_text_static').animate({
            width:300,
        },500);
        $('#fts_box_text_static').children().show();
        $('#fts_static_tools span').show();
        $('#fts_accordian').removeClass('fts_expand').addClass('fts_collapse');        
        br.fts_accord = "expanded";
        return
    }
}




// FTS search results Dialog ///////////////////////////////////////////////////////////////////////////////////////////////////
function getFTSResultsDialog (row_start, search_term) {

    hideFTSResultsStatic();

    //clear previous results            
    $("#fts_box_text").html('<h2 id="fts_terms_dialog"></h2>');    
   
    var squery = 'http://141.217.97.167:8080/solr/bookreader/select/?q=OCR_text:'+search_term+'&fq=ItemID:'+ItemID+'&sort=page_num%20asc&start='+row_start+'&rows=10&indent=on&wt=json&json.wrf=callback_dialog';    

    //pagination counters
    var prev = row_start - 10;
    var next = row_start + 10;

    //function for checking odd or even (leaf side)
    function isEven(value) {
    return (value%2 == 0);
    }

    //solr query
    $.ajax({          
      url: squery,
      dataType: 'jsonp',
      jsonpCallback: 'callback_dialog',
      success: function(result) {
        var cURL = window.location.href;         
        var Parent = document.getElementById('fts_box_text');
        
        // conditional for no results
        if (result.response.numFound == 0) {                    
            $('#fts_terms_dialog').html('Search results for: "' + search_term + '"');
            var NewDiv = document.createElement('DIV');
            NewDiv.innerHTML = '<div><p>Found no results.</p></div>';
            Parent.appendChild(NewDiv);            
        }

        else {
            //set counter for alternating background color
            counter = 0;

            $('#fts_terms_dialog').html('Search results for: "<span class="fts_highlight">' + search_term + '</span>"');
            $('#fts_terms_dialog').append('<div id="fts_counts_dialog"></div>');            
            $('#fts_counts_dialog').append('Found on '+result.response.numFound+' pages.</br>');
            if (next < result.response.numFound){
                $('#fts_counts_dialog').append('Displaying results: '+(row_start + 1)+' - '+(row_start + 10));
            }
            else {
                $('#fts_counts_dialog').append('Displaying results: '+(row_start + 1)+' - '+result.response.numFound);    
            }

            for (var i = 0; i < result.response.docs.length; i++) { 
                
                //same for all instances in one page
                var ftsURL = cURL.replace(/(.*?page\/).*?(\/.*?)/, "$1" + result.response.docs[i].page_num + "$2");
                var page_text = result.response.docs[i].OCR_text.toString();                 

                // grab OCR snippet                
                // More difficult than originally thought.  The current setup returns only the first match for a given page of OCR text. We want every instance within a page.                
                // The following function produces the indices of all occurences of the search term on a page.  
                // Iterate over these instances as the OCR snippet each time.

                // INDICES LOCATOR /////////////////////////////////////////////////////////////////////////
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

                search_term = search_term.replace(/["']/g, "");
                var term_indices = getIndicesOf(search_term, page_text, false);                                
                // INDICES LOCATOR /////////////////////////////////////////////////////////////////////////

                //Itereate through the indices and display results
                for (var instance_counter = 0; instance_counter < term_indices.length; instance_counter++) {
                    var search_loc = term_indices[instance_counter]; //search_term location

                    if (page_text.length < 80) {
                        var snippet_start = 0;
                        var snippet_end = page_text.length;   
                    }

                    else {
                        //determine start location
                        if (search_loc - search_term.length <= 30 ){
                            var snippet_start = 0;
                        }
                        else {
                            var snippet_start = search_loc - 30;  
                        }              
                        
                        // determine end location
                        if (search_loc + search_term.length >= page_text.length - 50){
                            var snippet_end = page_text.length;
                        }
                        else {
                            var snippet_end = search_loc + search_term.length + 50;                
                        }
                    }                    

                    // alert(ftsURL);
                    // alert(snippet_start);
                    // alert(snippet_end);

                    //create snippet and append to page DOM             
                    OCR_snippet = page_text.slice(snippet_start,snippet_end).replace(search_term,'<span class="fts_highlight">'+search_term+'</span style="background-color:pink;">');

                var thisResult = '<a href="' + ftsURL + '">page: <b>' + result.response.docs[i].page_num + '</a></b><br>"...' + OCR_snippet + '..."<br><br>';                

                $('#fts_box_text').append('<div id="fts_result_dialog_'+counter+'"></div>');
                $("#fts_result_dialog_"+counter).html(thisResult);
                if (counter % 2 === 0){
                  $("#fts_result_dialog_"+counter).addClass('osc_dark');
                }               

                //bump counter
                counter++;
                }
            }

            //add pagination navigation
            $('#fts_box_text').append('<div class="fts_nav_dialog"></div>');
            if (row_start == 0 && result.response.numFound < 10){                
                return;
            }

            else if (row_start == 0 && result.response.numFound > 10){
                var func_call = "getFTSResultsDialog("+next+",'"+search_term+"');"                            
                $('.fts_nav_dialog').append('<a class="fts_page_nav fts_next" onclick="'+func_call+' return false;">Next 10</a>');
            }           
                    
            else {                
                if (next < result.response.numFound) {
                    var func_call_next = "getFTSResultsDialog("+next+",'"+search_term+"');"
                    $('.fts_nav_dialog').append('<a class="fts_page_nav fts_next" onclick="'+func_call_next+' return false;">/ Next 10</a>');
                }
                var func_call_prev = "getFTSResultsDialog("+prev+",'"+search_term+"');"
                $('.fts_nav_dialog').append('<a class="fts_page_nav fts_previous" onclick="'+func_call_prev+' return false;">Previous 10</a>');
            }

            //prepend  fts_page_nav class to top
            $('.fts_nav_dialog').clone().insertAfter('#fts_terms_dialog','</br>');
            $('.fts_nav_dialog').append('</br></br>');
            $('.fts_page_nav').css('color','#00594d');
        }
        
      }
    });
    
    // function to create actual results box
    displayFTSResultsDialog();       
}

//Display FTS results
function displayFTSResultsDialog(){                                
    $fts_dialog.dialog('open');
    if (first_dialog == true) { 
        var fts_handle = $fts_dialog.dialog('widget');        
        fts_handle.position({my: "left top", at: "left bottom", offset: "10 10", of: '#WSUtoolbar'});        
        fts_handle.css("overflow-y", "scroll"); //restores it
    }

    first_dialog = false;
    return false;
}
// FTS DIALOG END /////////////////////////////////////////////////////////////////////////////////////////////////

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
            
            // left page
            var leafStr = '00000';            
            var htmlStr = rootpage.toString();
            var re = new RegExp("0{"+htmlStr.length+"}$");
            var leftOCR_URL = '../data/'+ItemID+'/OCR/'+ItemID+leafStr.replace(re, htmlStr) + '.htm';            

            //right page
            var leafStr = '00000';            
            var htmlStr = secondarypage.toString(); //plus two for other page?
            var re = new RegExp("0{"+htmlStr.length+"}$");
            var rightOCR_URL = '../data/'+ItemID+'/OCR/'+ItemID+leafStr.replace(re, htmlStr) + '.htm';                

            if (rootpage == 1){ //conditional for cover
                $('#BRtwopageview').append("<div class='OCR_box right pbox_border OCR_shadow'><div class='OCR_box_text OCR_right'></div></div>");                            
                $('.OCR_box.right .OCR_box_text').load(leftOCR_URL);
            }
            else if (rootpage == br.numLeafs){ //conditoinal for back page
                $('#BRtwopageview').append("<div class='OCR_box left pbox_border OCR_shadow'><div class='OCR_box_text OCR_left'></div></div>");
                $('.OCR_box.left .OCR_box_text').load(leftOCR_URL); 
            }
            else {
                $('#BRtwopageview').append("<div class='OCR_box left pbox_border OCR_shadow'><div class='OCR_box_text OCR_left'></div></div>");                                
                $('#BRtwopageview').append("<div class='OCR_box right pbox_border OCR_shadow'><div class='OCR_box_text OCR_right'></div></div>");
                $('.OCR_box.left .OCR_box_text').load(leftOCR_URL);
                $('.OCR_box.right .OCR_box_text').load(rightOCR_URL);
            }
        } 

        //1up mode --> call singlepageOCR()
        if (mode == "1up"){
            singlepageOCR();
            //listens for page change - hashchange - runs singlepageOCR() again
            $(window).bind('hashchange', function() {
                if (br.OCRstatus != false){
                    singlepageOCR();
                }
            });
        }

        //reveal
        // $('.OCR_box').slideDown(500);
        $('.OCR_box').fadeIn();        
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

    //insert OCR text
    var leafStr = '00000';            
    var htmlStr = rootpage.toString(); //plus two for other page?
    var re = new RegExp("0{"+htmlStr.length+"}$");
    var singleOCR_html = '../data/'+ItemID+'/OCR/'+ItemID+leafStr.replace(re, htmlStr) + '.htm';
    $('.OCR_box_single .OCR_box_text').load(singleOCR_html);


    //set OCR overlay dimensions and position
    $('.OCR_box_single').css({
        'height':height,
        'width':width,
        'top':top,
        'left':left
        });

    //3) .show()
    // $('.OCR_box_single').slideDown(500);
    $('.OCR_box_single').fadeIn();
}

//Hide OCR
function hideOCR (){
    //add conditional for 2up & 1up modes
    br.OCRstatus = false;
    // $('.OCR_box, .OCR_box_single').slideUp(500, function() {
    $('.OCR_box, .OCR_box_single').fadeOut(function() {
        $('.OCR_box, .OCR_box_single').remove();
    });        
}

function toggleOCR() {    
    if (br.OCRstatus == false){

        showOCR();
        // show OCR controls
        $('.OCR_tools').fadeIn();
        $('.toggleOCR').addClass("rounded_edge_highlight").css("border","1px solid rgba(247,227,0,.8)");        
        return;
    }
    if (br.OCRstatus == true){
        hideOCR();
        // hide OCR tools
        $('.OCR_tools').fadeOut();
        $('.toggleOCR').css("border", "none");
        return;
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
    var squery = 'http://141.217.97.167:8080/solr/bookreader/select/?q=page_num:['+$current_layout.rootpage+' TO '+$current_layout.secondarypage+' ]&fq=ItemID:'+ItemID+'&wt=json&json.wrf=callback';

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
// does not work in Firefox
function fontResize(delta){ 

    // font-size conversion array
    var conv_array = [ '6px', 'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '72px', '90px' ];


    var text_body = $('.OCR_box_text');
    var paragraphs = text_body.children('p');    
    paragraphs.each(function () {        
        var font_handle = $(this).children('font');        
        //consider iterating through the array that is font_handle...        
        // var fsize = font_handle.css('font-size'); //previous method, did not work in Firefox
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
    if (br.OCRstatus == true) {
        toggleOCR();
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
    if (br.OCRstatus == true) {
        toggleOCR();
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
    if (br.OCRstatus == true) {
        toggleOCR();
    }
    var $current_layout = getPageInfo();
    var to_thumbs = window.location.protocol + "//" + window.location.host+window.location.pathname+window.location.search+"#page/"+$current_layout.rootpage+"/mode/thumb";
    window.location = to_thumbs;
}

//fades out Toolbar and Footer
function toolbarTransToggle(){
    if (br.toolbar_trans == false){
        // $('#WSUtoolbar').css({ 'opacity' : 0.2 });
        $('#WSUtoolbar,#WSUfooter').fadeTo("slow",.4);
        $('#WSUtoolbar,#WSUfooter').css({backgroundColor:"transparent"});
        $('#WSUtoolbar').removeClass('shadow');
        //maybe do more here?  remove "full-text-search"?  actually, remove most of everything?

        br.toolbar_trans = true;
    }
    else{
        // $('#WSUtoolbar').css({ 'opacity' : 0.9 });
        $('#WSUtoolbar,#WSUfooter').fadeTo("slow",.9);
        $('#WSUtoolbar,#WSUfooter').css({backgroundColor:"rgba(225, 221, 201, .9)"});
        $('#WSUtoolbar').addClass('shadow');
        br.toolbar_trans = false;
    }
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
function fullScreen(){
    
    // the following works in Firefox...
    // var elem = document.getElementById("bookreader_wrapper");
    // if (elem.requestFullScreen) {
    //   elem.requestFullScreen();
    // } else if (elem.mozRequestFullScreen) {
    //   elem.mozRequestFullScreen();
    // } else if (elem.webkitRequestFullScreen) {
    //   elem.webkitRequestFullScreen();
    // }

    //calls "fullscreen_API"
    if (fullScreenApi.supportsFullScreen) {
        var reader_handle = document.getElementById("bookreader_wrapper");
        fullScreenApi.requestFullScreen(reader_handle);    
    }

}

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
        $('#dBigArrow').offset({ top: windowheight - 85, left: $(window).width() / 2 - $('.bigArrowBoxVert').width() / 2});
        $('#uBigArrow').offset({ top: 45, left: $(window).width() / 2 - $('.bigArrowBoxVert').width() / 2});
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
        $('#rBigArrow').position({my: "left center", at: "right center", offset: "10 0", of: '.BRleafEdgeR'});
        $('#lBigArrow').position({my: "right center", at: "left center", offset: "-10 0", of: '.BRleafEdgeL'});
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
                    $(".bigArrowHandle").stop(true, false).animate({opacity: .06}, 300);
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
        $(".bigArrowHandle").stop(true, false).animate({opacity: .06}, 750);
    },2500) 
}

function toolbarsMinimize(){

    var $current_layout = getPageInfo(); 

    if ($('#WSUtoolbar_minimize').hasClass('WSUdn')) {            
        $('#WSUtoolbar, #WSUfooter').slideUp(750);
        $('#WSUtoolbar_minimize').animate({bottom:'0px'},{duration:750});
        $('#WSUtoolbar_minimize').addClass('WSUup').removeClass('WSUdn');
        $('#WSUtoolbar_minimize').html("^");
        
        // if (when) nav arrows are on screen
        if (br.bigArrowStatus == true){
            if ($current_layout.mode == "1up" || $current_layout.mode == "thumb"){
                $('#dBigArrow').offset({ top: $(window).height() - 50});                
                $('#uBigArrow').offset({ top: 10}); 
            }            
        }
    }
    else {            
        $('#WSUtoolbar, #WSUfooter').slideDown(750);
        $('#WSUtoolbar_minimize').animate({bottom:'35px'},{duration:750});
        $('#WSUtoolbar_minimize').addClass('WSUdn').removeClass('WSUup');
        $('#WSUtoolbar_minimize').html("v");

        // if (when) nav arrows are on screen
        if (br.bigArrowStatus == true){
            if ($current_layout.mode == "1up" || $current_layout.mode == "thumb"){
                bigArrows('resize');               
            }            
        }
    }
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
});


















