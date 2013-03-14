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

    

    //show minimize arrow, looks nicer post launch
    $("#WSUtoolbar_minimize").show();

    //OCR prep    
    $(".OCR_tools").hide();

    //create large navigation arrows - 2 second bold to show user they are there
    bigArrows();
    bigArrowsPulse();

    //retrieve book metadata and set to br.bookMetaObj, set title of browser page
    $(document).ready(function() {
            // currently pulling from ramsey collection objects only
            var metaquery = 'php/fedora_XML_request.php?PIDsafe='+PIDsafe+'&datastream=MODS&datatype=xml';
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
                br.bookMetaObj = response;
                $("#doc_title").html(br.bookMetaObj.titleInfo.title);

            }

            function pull_meta_fail(){
                br.bookMetaObj = null;
            }

        });
    
    //detect interface - load standard or mobile toolbar
    //add catch here to simulate mobile
    console.log("You are on "+isMobile.any());
    //go mobile
    if (isMobile.any() != null || br.mobileRequest == "true"){
        br.mobileStatus = "true";
        toggleCondToolbar();
        $(".bigArrowHandle").remove();
    }

    //go standard
    else{
        $("#WSUtoolbar").load('inc/views/stanToolbar.htm', function() {
            //OCR prep    
            $(".OCR_tools").hide();

            // Update page number box.  $$$ refactor to function
            if (null !== br.getPageNum(br.currentIndex()))  {
                $("#BRpagenum").val(br.getPageNum(br.currentIndex()));
            } else {
                $("#BRpagenum").val('');
            }

            //populate leaf location
            $('#leaf_count').html(br.numLeafs);

            //sets status
            br.toolbarStatus = "standard" 
        });
    }

    //detect small browser window, load condensed if need be
    if ($(window).width() < 1160){
        toggleCondToolbar();
    }    
    

} //closes postLaunch()




















