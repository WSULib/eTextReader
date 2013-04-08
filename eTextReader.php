<?php
//checks authentication status
include "php/ebook_auth.php";
 
if ($auth_status == "allow"){
    
}
else{
    $currentURL = $_SERVER['PATH_INFO'];
    header( "Location: http://proxy.lib.wayne.edu/login?url=".curPageURL() ) ;
}
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
<head>
    <title id="doc_title">[Unknown Title]</title>   
   
    <!--jquery load, 1.4 works best -->
    <script type="text/javascript" src="js/jquery-1.4.2.min.js"></script>       
    <script type="text/javascript" src="js/jquery-ui-1.8.5.custom.min.js"></script>
    <!--<script type="text/javascript" src="js/dragscrollable.js"></script> -->
    <script type="text/javascript" src="js/jquery.ui.ipad.js"></script>
    <script type="text/javascript" src="js/jquery.bt.min.js"></script>

    <!-- Main BookReader CSS -->    
    <link id="css_icons" rel="stylesheet" type="text/css" href="css/elusive-iconset/css/elusive-webfont.css"/>
    <!--[if lte IE 7]><script src="css/elusive-iconset/lte-ie7.js"></script><![endif]-->    
    <link id="css_pointer" rel="stylesheet" type="text/css" href="css/orig_stylesheet.css"/>
    <link id="css_pointer" rel="stylesheet" type="text/css" href="css/WSU_def_stylesheet.css"/>
    <link id="css_pointer" rel="stylesheet" type="text/css" href="css/WSU_layout.css"/>

    <!-- Load BR init and local functionality -->    
    <script type="text/javascript" src="js/WSU_bookreader.js"></script>        
    <script type="text/javascript" src="js/WSU_js.js"></script>
    <script type="text/javascript" src="js/WSU_launch.js"></script>        
    <script type="text/javascript" src="js/fullscreen_API.js"></script>

    <!--URL hash detector / used to detect page changing-->
    <script type="text/javascript" src="js/hashchange.js"></script>

    <!--jplayer -->
    <script type="text/javascript" src="inc/jPlayer/jquery.jplayer.min.js"></script>
    

    <!--jquery highlight-->
    <script type="text/javascript" src="js/jquery.highlight.js"></script> 

    <!--colorbox for metadata information-->
    <script src="js/jquery.colorbox-min.js"></script>
    <link rel="stylesheet" type="text/css" href="inc/colorbox/itemMetadata/colorbox.css"/>

    <!--mobile detection script-->
    <script src="js/detectMobile.js"></script>

    <!--NON-MOBILE ONLY-->
    <!--magnifier / tjpzoom -->    
    <script type="text/javascript" src="js/jquery.loupe.js"></script>
    
    <!-- Modernizr -->
    <script type="text/javascript" src="js/modernizr.js"></script>

    <!-- Bootstrap Tooltips-->
    <link rel="stylesheet" type="text/css" href="inc/bootstrap_tooltips/css/bootstrap.css"/>
    <script type="text/javascript" src="inc/bootstrap_tooltips/js/bootstrap.js"></script>

</head>

<body>
    <div id="bookreader_wrapper">    

        <div id="overlays"></div>

        <div id="WSUtoolbar" class="shadow">

            <div class="tool_row">

                <div id="first_row">                    
                    <div class="logo tools left">
                        <a href="http://www.lib.wayne.edu/" style="text-decoration:none;"><img id="lib_logo" src="./images/icons/library_system_w_v2.png" /></a>
                    </div>

                    <div class="icon tools left">
                        <ul class="the-icons">                        
                            <li><i class="icon-step-backward" onclick='br.leftmost(); return false;'></i></li>
                            <li><i class="icon-arrow-left" onclick='br.left(); return false;'></i></li>
                            <li><i class="icon-arrow-right" onclick='br.right(); return false;'></i></li>                                                                        
                            <li><i class="icon-step-forward" onclick='br.rightmost(); return false;'></i></li>                                            
                        </ul>            
                    </div>

                     <div class="icon tools left" id="jump_to_form">
                        <div id="jump_form_div">
                            <form action='javascript:' onsubmit='br.jumpToPage(this.elements[0].value)'>
                                <span class='label'>Page<input id='BRpagenum' type='text' size='3' onfocus='br.autoStop();'/>of <span id="leaf_count"></span></span>
                            </form>
                        </div>
                    </div>

                    <div class="icon tools left" id="cogIcon">
                        <ul class="the-icons">                        
                            <li><i class="icon-cog" onclick='toggleMoreTools(); return false;'></i></li>
                        </ul>
                    </div>                                                          
                    
                    <div id="first_row_pivot" class="collapseRow">                        
                        <div class="fts_form left first" id="fts_search">
                            <label>Full-text search:</label>                
                            <form id="fts_form" action='javascript:' onsubmit='getFTSResultsStatic(0)'>
                                <input id='fts_input' class="fts_input_box input" type='text' size='20' />                    
                                <button id="fts_form_button" type="button" class="btn btn-append" onclick="getFTSResultsStatic(0); return false;">search</button> 
                            </form>                
                        </div>
                    </div>                    
                </div> <!--closes first row-->

                <div id="second_row" class="collapseRow">
                    <div class="icon tools left" id="second_row_leftmost">
                        <ul class="the-icons">       
                            <li><i class="icon-zoom-out" onclick='br.zoom(-1); return false;' title="Zoom out"></i></li>
                            <li><i class="icon-zoom-in" onclick='br.zoom(1); return false;' title="Zoom in"></i></li>
                            <li><span id="zoom_level" class='label'><span id='BRzoom'></span></span></li>
                        </ul>                        
                    </div>                 
                    
                    <div rel="tooltip" class="icon tools right second" title="Layout Tools">                                                 
                        <ul id="mode_icons" class="the-icons">                        
                            <li><i id="1up_icon" class="icon-file" onclick="launch1up(); return false;"></i></li>
                            <li><i id="2up_icon" class="icon-book" onclick="launch2up(); return false;"></i></li>
                            <li><i id="thumbs_icon" class="icon-th" onclick="launchThumbs(); return false;"></i></li>                                                                        
                            <li><i id="plain_text_icon" class="icon-align-justify" onclick='plainText();' title="Switches to Plain Text / HTML"></i></li>                        
                        </ul>                    
                    </div>             

                    <div id="second_row_pivot" >
                        <div class="icon tools right second">
                            <ul class="the-icons">
                                <!--<li><i class="toggleOCR" onclick='toggleOCR(); return false;' style="font-size:1.6em; font-style:normal">text overlay</i></li>-->
                                <li><i class="toggleOCR icon-file-alt" onclick='toggleOCR(); return false;'></i></li>                
                                <li><i style="display:none;" class="OCR_tools icon-plus" onclick='fontResize("increase"); return false;'></i></li>
                                <li><i style="display:none;" class="OCR_tools icon-minus" onclick='fontResize("decrease"); return false;'></i></li>
                                <li><i class="icon-speaker" onclick='speakPagealoud();' title="Click to Speak Aloud"></i></li>                         
                                <li><i class="icon-screenshot" onclick='magLoupe();' title="Click to use magnifying loupe"></i></li>
                                <li><i class="icon-resize-full" onclick='goFullScreen();' title="Click to use magnifying loupe"></i></li>
                                <li><i class="icon-info-sign" onclick='itemInfo();' title="Book Info"></i></li>                                        
                            </ul>                                                     
                        </div>
                    </div>
                </div> <!--closes second row-->                                    

            </div> <!--closes tool row div -->             

        </div>

        <!--Set minimize arrow outside of toolbar structure, turned on in postLaunch function -->
        <div id="WSUtoolbar_minimize" class="toolbar_exposed" onclick="toolbarsMinimize(); return false;" title="Show/hide nav bar">
            <ul class="the-icons">                        
                <li><i id="minimize_handle" class="icon-chevron-up"></i></li>
            </ul>
        </div>            

        <!-- Containing and target DIV for bookreader construction-->
        <div id="BookReader">        
            <p>This book reader requires JavaScript to be enabled. Please check that your browser or device supports JavaScript and that it is enabled.</p>           
        </div>

        <!--full-text search infrastructure-->
        <div id="fts_box_text_static" class="shadow"></div>        

    </div> <!--closes bookreader_wrapper-->
</body>

<script type="text/javascript">
    preLaunch();    
</script>

</html>
