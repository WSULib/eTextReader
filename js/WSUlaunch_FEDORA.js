//////////////////////////////////////////////////////////////////////////////////////
function launchBookReader(ItemID, leafs, pheight, pwidth, item_title){
//////////////////////////////////////////////////////////////////////////////////////    

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

    // FEDORA
    br.getPageURI = function(index, reduce, rotate, mode) {
        // decision to bump internal IA index
        index = index + 1;            

        // add logic for rendering smaller images for thumbnail mode                
        var $current_layout = getPageInfo();
        var mode = $current_layout.mode;

        // convert ItemID to PIDsafe
        var PIDsafe = ItemID.replace(/_/g,"");                          

        if (mode != 'thumb') {
            var imageSizeLoc = ":images/"
            var url = 'http://141.217.172.45:8080/fedora/objects/'+PIDsafe+imageSizeLoc+"datastreams/IMAGE_"+index+'/content';
            }
        else {
            var imageSizeLoc = ":thumbs/";
            var url = 'http://141.217.172.45:8080/fedora/objects/'+PIDsafe+imageSizeLoc+"datastreams/THUMB_"+index+'/content';                        
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

    // For a given "accessible page index" return the page number in the book.
    //
    // For example, index 5 might correspond to "Page 1" if there is front matter such
    // as a title page and table of contents.
    br.getPageNum = function(index) {
        return index+1;
    }

    // Total number of leafs
    // br.numLeafs = 40;
    br.numLeafs = parseInt(leafs);

    // Book title and the URL used for the book title link
    br.bookTitle= item_title;
    br.bookUrl  = '141.217.172.45';

    // Override the path used to find UI images - DONT SEEM TO NEED THIS
    // br.imagesBaseURL = '../data/'+ItemID+'/images/';

    br.getEmbedCode = function(frameWidth, frameHeight, viewParams) {
        return "Embed code not yet supported.";
    }

    // Let's go!
    br.init();

    // display options and update metadata
    // $('#BRtoolbar').find('.read').hide();
    // $('#textSrch').hide();
    // $('#btnSrch').hide();   
    // $('.item_title span.title').html(br.bookTitle.toString());
    $('#leaf_count').html(leafs.toString());
} //closes launch



