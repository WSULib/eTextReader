<?php

include "../config/config.php";

//get variables create URL
$PIDsafe = $_GET['PIDsafe'];
$datastream_request = $_GET['datastream'];
$data_type = $_GET['datatype'];
$request_URL = "http://$repo_baseURL/fedora/objects/$PIDsafe/datastreams/$datastream_request/content";

// XML
if ($data_type == 'xml'){
	// returns XML object - this might be more appropriate for content metadata
	$xml_simple = simplexml_load_file($request_URL);	
	$json_simple = json_encode($xml_simple);	
	echo $json_simple;
	return;
}

// XML to JSON
if ($data_type == 'xml2json'){
	// returns XML object - this might be more appropriate for content metadata
	$xml_simple = simplexml_load_file($request_URL);	
	$json_simple = json_encode($xml_simple);	
	echo $json_simple;
	return;
}

if ($data_type == 'namespace2json'){
	// returns XML object - this might be more appropriate for content metadata
	$fileContents = file_get_contents($request_URL);	

	//Strip out the mods: namespace from the xml
	$pattern1 = '/<[a-zA-Z0-9].+?\:(.+?)>/i';
	$replacement1 = '<$1>';
	$pattern2 = '/<\/[a-zA-Z0-9].+?\:(.+?)>/i';
	$replacement2 = '</$1>';

	$replaced1 = preg_replace($pattern1, $replacement1, $fileContents);
	$replaced2 = preg_replace($pattern2, $replacement2, $replaced1);
	//transform into json
	$json = json_encode(simplexml_load_string($replaced2));
	echo $json;
	return;
}

// HTML
else {
	//returns file contents untouched
	$datastream_bits = file_get_contents($request_URL);	
	echo $datastream_bits;
	return;
}


?>
