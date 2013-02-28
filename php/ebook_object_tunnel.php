<?php

//get variables create URL
$URL = $_POST['encodedQueryURL'];
$data_type = $_POST['data_type'];


// XML
if ($data_type == 'xml2json'){
	// returns XML object - this might be more appropriate for content metadata
	$xml_simple = simplexml_load_file($URL);	
	// print_r($xml_simple);
	$json_simple = json_encode($xml_simple);
	// print_r($json_simple);
	echo $json_simple;
	return;
}

// json
elseif ($data_type == 'json'){	
	$datastream_bits = file_get_contents($URL);	
	echo $datastream_bits;
	return;
}

// HTML
else {
	//returns file contents untouched
	$datastream_bits = file_get_contents($URL);	
	echo $datastream_bits;
	return;
}

?>