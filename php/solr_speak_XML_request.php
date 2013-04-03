<?php


//get variables create URL
$search_term = urlencode($_GET['search_term']);
$ItemID = urlencode($_GET['ItemID']);
$row_start = urlencode($_GET['row_start']);
$solr_baseURL = $_GET['solr_baseURL'];
$data_type = $_GET['datatype'];


//need $search_term, $ItemID (not PID, but indexed ID), $row_start
$request_URL = "select/?q=OCR_text:$search_term&fq=ItemID:$ItemID&sort=page_num%20asc&start=$row_start&rows=10&indent=on&hl=true&hl.fl=OCR_text&hl.snippets=1000&hl.fragmenter=gap&hl.fragsize=70&wt=json";

$request_URL = $solr_baseURL.$request_URL;
// echo $request_URL; //only for testing, will break solr query

// XML
if ($data_type == 'xml'){
	// returns XML object - this might be more appropriate for content metadata
	$xml_simple = simplexml_load_file($request_URL);	
	// print_r($xml_simple);
	$json_simple = json_encode($xml_simple);
	// print_r($json_simple);
	echo $json_simple;
	return;
}

//JSON
elseif ($data_type == 'json') {
	//returns file contents untouched
	$datastream_bits = file_get_contents($request_URL);	
	echo $datastream_bits;
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