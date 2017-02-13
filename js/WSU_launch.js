//set some globals
//this is setting global "ItemID" still used by Solr
var ItemID = getURLParam('ItemID');        
var mobileRequest = getURLParam('m');        
var PIDsafe = ItemID.replace(/_/g,"");

//pull book structure
function preLaunch(img_rewrite) {

    $(document).ready(function(){
      $.ajax({
        type: "GET",
        url: "https://"+config.APP_HOST+"/api/item/"+ItemID+"/iiif",
        dataType: "json",
        success: metasuccess        
      });
    });

    function metasuccess(response){
        var manifest = response;        
        var pheight = manifest.sequences[0].canvases[0].height; 
        var pwidth = manifest.sequences[0].canvases[0].width;
        var leafs = manifest.sequences[0].canvases.length;

        //proxied image access
        if (img_rewrite === "true"){
            var baseURL = "https://"+config.APP_HOST+".proxy.lib.wayne.edu/"; //proxy added to URL                
        }
        //WSU IP ranges image access
        else {        
            var baseURL = "https://"+config.APP_HOST+"/"; //This cannot be localhost, as it codes the src for <img> tags on the client side.
        }
        var solr_baseURL = "https://localhost/solr4/bookreader/";                
        //sets things in motion to launchBookReader()
        launchBookReader(leafs, pheight, pwidth, ItemID, baseURL, solr_baseURL, mobileRequest, manifest);
    }

}

//////////////////////////////////////////////////////////////////////////////////////
function launchBookReader(leafs, pheight, pwidth, ItemID, baseURL, solr_baseURL, mobileRequest, manifest){

    // Create the BookReader object
    br = new BookReader();   

    // set manifest
    br.manifest = manifest;
    
    br.getPageWidth = function(index) {
        // return pageWidth;
        return parseInt(pwidth);
    }
    
    br.getPageHeight = function(index) {
        // return pageHeight;
        return parseInt(pheight);
    }

    // pulling from Loris Image Server
    br.getPageURI = function(index, reduce, rotate, mode) {
        // decision to bump internal IA index
        index = index + 1;            

        // add logic for rendering smaller images for thumbnail mode                
        var $current_layout = getPageInfo();
        var mode = $current_layout.mode;

        // toggle image crop if 1-up mode
        if (mode == '1up') {
            launch1up();
        }
        if (mode == '2up') {
            launch2up();
        }
        if (mode == 'thumb') {
            launchThumbs();
        }

        
        // PROD
        if (mode != 'thumb') {
            var url = baseURL+'loris/fedora:'+ItemID+"_Page_"+index+"|JP2/full/,1700/0/default.jpg";
        }
        else {
            var url = baseURL+'loris/fedora:'+ItemID+"_Page_"+index+"|THUMBNAIL/full/,240/0/default.jpg";                        
        }
        
        return url;
    }

    // Return which side, left or right, that a given page should be displayed on
    br.getPageSide = function(index) {
        if (0 == (index & 0x1)) {
            return 'R';
        } else {
            return 'L';
        }
    }

    // This function returns the left and right indices for the user-visible
    // spread that contains the given index.  The return values may be
    // null if there is no facing page or the index is invalid.
    br.getSpreadIndices = function(pindex) {   
        var spreadIndices = [null, null]; 
        if ('rl' == this.pageProgression) {
            // Right to Left
            if (this.getPageSide(pindex) == 'R') {
                spreadIndices[1] = pindex;
                spreadIndices[0] = pindex + 1;
            } else {
                // Given index was LHS
                spreadIndices[0] = pindex;
                spreadIndices[1] = pindex - 1;
            }
        } else {
            // Left to right
            if (this.getPageSide(pindex) == 'L') {
                spreadIndices[0] = pindex;
                spreadIndices[1] = pindex + 1;
            } else {
                // Given index was RHS
                spreadIndices[1] = pindex;
                spreadIndices[0] = pindex - 1;
            }
        }
        
        return spreadIndices;
    }

    // For example, index 5 might correspond to "Page 1" if there is front matter such
    // as a title page and table of contents.
    br.getPageNum = function(index) {
        return index+1;
    }

    // Total number of leafs    
    br.numLeafs = parseInt(leafs);

    br.getEmbedCode = function(frameWidth, frameHeight, viewParams) {
        return "Embed code not yet supported.";
    }

    // Let's go!
    br.init();

    //set some global variables
    br.ItemID = ItemID;
    br.baseURL = baseURL;
    br.solr_baseURL = solr_baseURL;
    br.mobileRequest = mobileRequest;
    br.textNav = false;

    //populate leaf location
    $('#leaf_count').html(leafs.toString());

    //finally, laucnh postLaunch()
    postLaunch();
} //closes launch

//////////////////////////////////////////////////////////////////////////////////////
//Postlaunch operations
function postLaunch() {

    //populate leaf location
    $('#leaf_count').html(br.numLeafs);  

    //flip arrows up/down if necessary
    $(document).ready(function() {
        if (br.mode == 1){
            arrowsFlip('1up');
        }
    });

    //remove overlay option if in thumbs
    if (br.mode === 3){
        $(".toggleOCR").hide();
    }
    
    // look for TOC datastream
    $(document).ready(function() {
        var tocURL = "php/fedora_XML_request.php?datatype=xml2json&PIDsafe="+ItemID+"&datastream=TOC";            
        function tocSuccess(response){
            // console.log(response);                
            if (response === false){                                
                $(".icon-indent-left").animate({'color':'rgb(158,158,158)'},0);
            }            
        }
        $.ajax({          
          url: tocURL,      
          dataType: 'json',            
          success: tocSuccess          
        });        
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // retrieve book metadata from Solr and set to br.bookSolrObj, set title of browser page
    $(document).ready(function(){
      $.ajax({
        type: "GET",
        url: "https://"+config.APP_HOST+"/"+config.API_PREFIX+"?functions[]=solrGetFedDoc",
        data: {
            "PID":ItemID            
        },
        dataType: "json",
        success: metasuccess        
      });
    });

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function metasuccess(response){
        br.bookSolrObj = response.solrGetFedDoc.response.docs[0];
        // set page title
        $("#doc_title").html(br.bookSolrObj.mods_title_ms[0]);            
    }    

    //mobile conditionals
    if (isMobile.any() != null || br.mobileRequest == "true"){
        br.mobileStatus = "true";                        
    }

    //iphone
    if (isMobile.any() == "iPhone"){
        br.switchMode(1); //launches in 1up mode if iphone        
        // set pixel density        
        $('head').append('<meta name="viewport" content="initial-scale=.50"/>');        
        br.mobileDevice = 'small_screen';
    }        

    //Modernizr
    if (Modernizr.touch == true){
        //remove functions that do not work with touch
        $(".icon-screenshot, .icon-resize-full").remove();   
        //remove hover tooltips
        $("#WSUtoolbar [data-ot]").removeAttr("data-ot");
        $("#WSUtoolbar_minimize [data-ot]").removeAttr("data-ot");
    }
    //not touch, append tooltip functionality
    else {        
        $("head").append('<script src="inc/opentip/opentip-native-excanvas.min.js"></script><link href="inc/opentip/opentip.css" rel="stylesheet" type="text/css" />');
    }

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

    // stats    
    // dataObject = {};
    // dataObject.PID = PIDsafe;
    // $(document).ready(function(){
    //   $.ajax({
    //     type: "POST",
    //     url: "php/stats.php",
    //     data: dataObject,
    //     dataType: "html",
    //     success: function(response){
    //         // console.log(response);
    //     }        
    //   });
    // });

    //resize container for small(ish) screens
    if ($(window).width() < 1160){        
        $(document).ready(function(){
            $("#BRcontainer").css({ 
                top:$("#WSUtoolbar").height()                
            });    
        });
    };

    //check for iframe, minimize toolbars if true
    if ( window.self === window.top ) {
    } else {                
        $("#css_layout").remove();
        $("head").append('<link href="css/WSU_embedded.css" rel="stylesheet" type="text/css" />');        

        //remove fullscreen option
        $(".icon-resize-full").remove();

        //create and update link 
        $("#cogIcon .the-icons").append('<li><a id="embedPopOut" target="_blank" href="'+br.baseURL+'eTextReader/eTextReader.php?ItemID='+br.ItemID+'#page/1/mode/2up"><i class="icon-resize-full" title="Open in New Window" data-ot="Open in New Window"></i></a></li>');                

        //speed up animations of toolbars
        br.toolbarAnimate = 10;
    }

} //closes postLaunch()



