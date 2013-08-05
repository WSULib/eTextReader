<?php

//get variables create URL
$squery = $_REQUEST['squery'];
//returns file contents untouched
$datastream_bits = file_get_contents($squery);	
echo $datastream_bits;
return;

?>