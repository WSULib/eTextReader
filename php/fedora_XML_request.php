<?php

// http://141.217.172.45:8080/fedora/objects/ramsey:Sketchesandscraps/datastreams/STRUCT_META/content

$PIDsafe = $_GET['PIDsafe'];
$datastream_request = $_GET['datastream'];

// $goober = simplexml_load_file('http://141.217.172.45:8080/fedora/objects/ramsey:Sketchesandscraps/datastreams/STRUCT_META/content');
$datastream_bits = file_get_contents("http://141.217.172.45:8080/fedora/objects/$PIDsafe/datastreams/$datastream_request/content");
print_r($datastream_bits);

return $datastream_bits


?>