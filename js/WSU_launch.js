//set some globals
//this is setting global "ItemID" still used by Solr
var ItemID = getURLParam('ItemID');        
var mobileRequest = getURLParam('m');        
var PIDsafe = ItemID.replace(/_/g,"");

//pull object structure
function preLaunch(img_rewrite) {
    $(document).ready(function() {        

        //default to 2up mode if mode fragment is missing
        var docURL = document.URL;
        if (docURL.indexOf("#") === -1){
            window.location.hash = '#page/1/mode/2up';
        }

        var metaquery = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+'&datastream=STRUCT_META&datatype=xml';                       

        //baseURL and solr_baseURL could be pulled or set in a config file, or DB
        function pull_meta(response){   
            //console.log(response)
            var pheight = response.dimensions.pheight;
            var pwidth = response.dimensions.pwidth;
            var leafs = response.dimensions.leafs;                
            var PIDsafeID = response.PIDsafe;
            var item_ID = response.item_ID;
            var collectionID = response.collection;            
            
            if (img_rewrite === "true"){
                //proxied image access
                var baseURL = "http://digital.library.wayne.edu.proxy.lib.wayne.edu/"; //proxy added to URL                
            }
            else {
                //WSU IP ranges image access
                var baseURL = "http://digital.library.wayne.edu/"; //This cannot be localhost, as it codes the src for <img> tags on the client side.
            }            

            var solr_baseURL = "http://localhost/solr4/bookreader/";                
            //sets things in motion to launchBookReader()
            launchBookReader(PIDsafeID, leafs, pheight, pwidth, item_ID, collectionID, baseURL, solr_baseURL, mobileRequest);
        }

        //returns json
        $(document).ready(function(){
          $.ajax({
            type: "GET",
            url: metaquery,
            dataType: "json",
            success: pull_meta
          });
        });

        
    });
}

//////////////////////////////////////////////////////////////////////////////////////
function launchBookReader(PIDsafeID, leafs, pheight, pwidth, ItemID, collectionID, baseURL, solr_baseURL, mobileRequest){    

    // Create the BookReader object
    br = new BookReader();   
    
    br.getPageWidth = function(index) {
        // return pageWidth;
        return parseInt(pwidth);
    }
    
    br.getPageHeight = function(index) {
        // return pageHeight;
        return parseInt(pheight);
    }

    // pulling from Fedora backend
    br.getPageURI = function(index, reduce, rotate, mode) {
        // decision to bump internal IA index
        index = index + 1;            

        // add logic for rendering smaller images for thumbnail mode                
        var $current_layout = getPageInfo();
        var mode = $current_layout.mode;                               

        if (mode != 'thumb') {
            var imageSizeLoc = ":images/"
            var url = baseURL+'fedora/objects/'+PIDsafeID+imageSizeLoc+"datastreams/IMAGE_"+index+'/content';
            }
        else {
            var imageSizeLoc = ":thumbs/";
            var url = baseURL+'fedora/objects/'+PIDsafeID+imageSizeLoc+"datastreams/THUMB_"+index+'/content';                        
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
        // <iframe src="http://digital.library.wayne.edu/eTextReader/eTextReader.php?ItemID={{APIParams.PID}}#page/1/mode/2up" width="575px" height="500px" frameborder="0" ></iframe>
    }

    // Let's go!
    br.init();

    //set some global variables
    br.ItemID = ItemID;
    br.PIDsafeID = PIDsafeID;
    br.collectionID = collectionID;
    br.FedoraPID = collectionID + ":" + PIDsafeID;
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
    
    //look for TOC datastream
    $(document).ready(function() {

        var tocURL = "php/fedora_XML_request.php?datatype=xml2json&PIDsafe=wayne:"+br.PIDsafeID+"&datastream=TOC";            
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

    // NEW - retrieve book metadata from Solr and set to br.bookSolrObj, set title of browser page
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    $(document).ready(function() {                        
                        
            // Default Search Parameters (pre form submission)
			var searchDefs = {};						      
			searchDefs.wt = "json";
			searchDefs.q = "id:wayne\\:"+br.PIDsafeID;
			searchDefs.raw = "noescape";
			
			//pass solr parameters os stringify-ed JSON, accepted by Python API as dicitonary
			solrParamsString = JSON.stringify(searchDefs);	
			// Calls API functions	
			var metaquery = "/WSUAPI?functions[]=solrSearch&solrParams="+solrParamsString;	
			$.ajax({				
				url: metaquery,
				dataType: "json",						
				success: pull_meta,
				error: pull_meta_fail
			});
			function pull_meta(response){      				   
                br.bookSolrObj = response.solrSearch.response.docs[0];
                console.log("bookSolrObj:",br.bookSolrObj);

                // set page title
                $("#doc_title").html(br.bookSolrObj.mods_title_ms[0]);

            }
            function pull_meta_fail(){
            	br.bookSolrObj == false;
                console.log("There was an error retrieving book solr object.");
            }
            
        });
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // ORIGINAL - retrieve book metadata and set to br.bookMetaObj, set title of browser page
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    $(document).ready(function() {            
            var metaquery = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+'&datastream=MODS&datatype=namespace2json';
            function pull_meta(response){                
                //no MODS
                if (response === false){
                    br.bookMetaObj = response;
                    $(".icon-info-sign").animate({'color':'rgb(158,158,158)'},0);                                        
                    return;
                }
                //MODS present
                else {   
                    br.bookMetaObj = response;
                    //Book Title - usually [0] of titleInfo
                    if (br.bookMetaObj.titleInfo.length != undefined){
                        var mainTitle = br.bookMetaObj.titleInfo[0].title;
                    }
                    else {
                        var mainTitle = br.bookMetaObj.titleInfo.title;
                    }
                    br.bookMetaObj.mainTitle = mainTitle; //pushes to global bookOjbect, might use later
                    $("#doc_title").html(mainTitle);
                }

            }
            function pull_meta_fail(){
                br.bookMetaObj = null;
            }
            //returns json
            $(document).ready(function(){
              $.ajax({
                type: "GET",
                url: metaquery,
                dataType: "json",
                success: pull_meta,
                error: pull_meta_fail
              });
            });            
        });
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    dataObject = {};
    dataObject.PID = PIDsafe;
    $(document).ready(function(){
      $.ajax({
        type: "POST",
        url: "php/stats.php",
        data: dataObject,
        dataType: "html",
        success: function(response){
            // console.log(response);
        }        
      });
    });

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
        // $(".logo.tools.left").prepend('<a id="embedPopOut" target="_blank" href="'+br.baseURL+'/eTextReader/eTextReader.php?ItemID=wayne:'+br.PIDsafeID+'#page/1/mode/2up">Open in New Window</a>');
        $("#cogIcon .the-icons").append('<li><a id="embedPopOut" target="_blank" href="'+br.baseURL+'eTextReader/eTextReader.php?ItemID=wayne:'+br.PIDsafeID+'#page/1/mode/2up"><i class="icon-resize-full" title="Open in New Window" data-ot="Open in New Window"></i></a></li>');                


        //remove toolbars
        // toolbarsMinimize();

        //speed up animations of toolbars
        br.toolbarAnimate = 10;
    }

} //closes postLaunch()



