//fades out Toolbar and Footer
    // <button class="" type="button" onclick='toolbarTransToggle();' title="Toggle Transparency of the Toolbars">Trans</button> 

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


