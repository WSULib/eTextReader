<?php

//get variables create URL
$squery = $_REQUEST['squery'];
//returns file contents untouched
$datastream_bits = file_get_contents($squery);	
echo $datastream_bits;
return;

// // XML
// if ($data_type == 'xml'){
// 	// returns XML object - this might be more appropriate for content metadata
// 	$xml_simple = simplexml_load_file($request_URL);	
// 	// print_r($xml_simple);
// 	$json_simple = json_encode($xml_simple);
// 	// print_r($json_simple);
// 	echo $json_simple;
// 	return;
// }

// //JSON
// elseif ($data_type == 'json') {
// 	//returns file contents untouched
// 	$datastream_bits = file_get_contents($request_URL);	
// 	echo $datastream_bits;
// 	return;
// }

// HTML
// else {
// 	//returns file contents untouched
// 	$datastream_bits = file_get_contents($request_URL);	
// 	echo $datastream_bits;
// 	return;
// }





?>