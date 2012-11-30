//////////////////////////////////////////////////////////////////////////////////////
function launchBookReader(ItemID, leafs, pheight, pwidth, item_title){
//////////////////////////////////////////////////////////////////////////////////////    

    // Create the BookReader object
    br = new BookReader();

    // var pageHeight = 1000;
    // var pageWidth = 750;

    // Return the width of a given page.  Here we assume all images are 800 pixels wide
    br.getPageWidth = function(index) {
        // return pageWidth;
        return parseInt(pwidth);
    }

    // Return the height of a given page.  Here we assume all images are 1200 pixels high
    br.getPageHeight = function(index) {
        // return pageHeight;
        return parseInt(pheight);
    }

    // We load the images from archive.org -- you can modify this function to retrieve images
    // using a different URL structure
    br.getPageURI = function(index, reduce, rotate, mode) {
        // reduce and rotate are ignored in this simple implementation, but we
        // could e.g. look at reduce and load images from a different directory
        // or pass the information to an image server

        // add logic for rendering smaller images for thumbnail mode                
        var $current_layout = getPageInfo();
        var mode = $current_layout.mode;                     

        if (mode != 'thumb') {
            var imageSizeLoc = "/images/"
            }
        else {
            var imageSizeLoc = "/images/thumbs/"
        }

        var leafStr = '00000';        
        var imgStr = (index+1).toString();        
        var re = new RegExp("0{"+imgStr.length+"}$");
        // var url = '../data/'+ItemID+'/images/'+ItemID+leafStr.replace(re, imgStr) + '.jpg'; //using ItemID for direcotry and image name
        var url = '../data/'+ItemID+imageSizeLoc+ItemID+leafStr.replace(re, imgStr) + '.jpg'; // with different thumbnails location
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

    // Override the path used to find UI images
    br.imagesBaseURL = '../data/'+ItemID+'/images/';

    br.getEmbedCode = function(frameWidth, frameHeight, viewParams) {
        return "Embed code not yet supported.";
    }

    // Let's go!
    br.init();

    // display options and update metadata
    $('#BRtoolbar').find('.read').hide();
    $('#textSrch').hide();
    $('#btnSrch').hide();   
    $('.item_title span.title').html(br.bookTitle.toString());
    $('#leaf_count').html(leafs.toString());
}


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
    $('#BookReader').append('<div id="WSUtoolbar_minimize" class="WSUdn" title="Show/hide nav bar">v</div>');
    $('#WSUtoolbar_minimize').click(function() {
        if ($('#WSUtoolbar_minimize').hasClass('WSUdn')) {            
            $('#WSUtoolbar, #WSUfooter').slideUp(750);
            $('#WSUtoolbar_minimize').animate({bottom:'0px'},{duration:750});
            $('#WSUtoolbar_minimize').addClass('WSUup').removeClass('WSUdn');
            $('#WSUtoolbar_minimize').html("^");
            // extend BRcontainer to fill
        }
        else {            
            $('#WSUtoolbar, #WSUfooter').slideDown(750);
            $('#WSUtoolbar_minimize').animate({bottom:'35px'},{duration:750});
            $('#WSUtoolbar_minimize').addClass('WSUdn').removeClass('WSUup');
            $('#WSUtoolbar_minimize').html("v");
        }

    });

    //set OCR status
    br.OCRstatus = false;

} //closes postLaunch()





