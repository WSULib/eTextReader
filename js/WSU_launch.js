//set some globals
//this is setting global "ItemID" still used by Solr
var ItemID = getURLParam('ItemID');        
var mobileRequest = getURLParam('m');        
var PIDsafe = ItemID.replace(/_/g,"");

//pull object structure
function preLaunch() {
    $(document).ready(function() {            
        var metaquery = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+'&datastream=STRUCT_META&datatype=xml';                       

        //returns json
        $(document).ready(function(){
          $.ajax({
            type: "GET",
            url: metaquery,
            dataType: "json",
            success: pull_meta
          });
        });

        //baseURL and solr_baseURL could be pulled or set in a config file, or DB
        function pull_meta(response){   
            console.log(response)
            var pheight = response.dimensions.pheight;
            var pwidth = response.dimensions.pwidth;
            var leafs = response.dimensions.leafs;                
            var PIDsafeID = response.PIDsafe;
            var item_ID = response.item_ID;
            var collectionID = response.collection;
            var baseURL = "http://141.217.172.153/";
            var solr_baseURL = "http://localhost/solr4/bookreader/";                
            //sets things in motion to launchBookReader()
            launchBookReader(PIDsafeID, leafs, pheight, pwidth, item_ID, collectionID, baseURL, solr_baseURL, mobileRequest);
        }
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

    //retrieve book metadata and set to br.bookMetaObj, set title of browser page
    $(document).ready(function() {
            
            var metaquery = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+'&datastream=MODS&datatype=namespace2json';
            // console.log(metaquery);            

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

            function pull_meta(response){
                console.log(response);   
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

            function pull_meta_fail(){
                br.bookMetaObj = null;
            }
        });
    
    //Device Detection -----------------------------------------------
    
    //mobile conditionals
    if (isMobile.any() != null || br.mobileRequest == "true"){
        br.mobileStatus = "true";                        
    }

    //iphone
    if (isMobile.any() == "iPhone"){
        br.switchMode(1); //launches in 1up mode if iphone
        $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'css/iPhone.css') );
    }

    //ipad
    if (isMobile.any() == "iPad"){                
        // $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'your stylesheet url') );
    }    

    //Modernizr
    if (Modernizr.touch == true){
        //remove functions that do not work with touch
        $(".icon-screenshot, .icon-resize-full").remove();        
    }

    // // DIAGNOSTIC //////////////////////////////////////////////////////////////
    // //retina / high resolution check
    // var retina = window.devicePixelRatio > 2;
    // if (retina) {
    // alert('you on a retina!');
    // }
    // else {
    //     alert('you is NOT on a retina.');
    // }

    // //resolution check
    // alert("Width: "+$(window).width()+" / Height: "+$(window).height());      

    // //your mobile device
    // alert(isMobile.any());
    // // DIAGNOSTIC //////////////////////////////////////////////////////////////

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

} //closes postLaunch()



