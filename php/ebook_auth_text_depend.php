<?php
//Utility to check if client IP matches requirements for a particular ebook
INCLUDE "sensitive.php";
require("config/config.php");

//expecting ebook PID as GET parameter
$clientIP = $_SERVER['REMOTE_ADDR']; 
$PID = $_GET['ItemID'];

//check security policy on etext object
$baseURL = "https://$FEDORA_USERNAME:$FEDORA_PASSWORD@silo.lib.wayne.edu/fedora/risearch?";
$queryOptions = "type=tuples&lang=itql&format=json&dt=on&stream=on&query=";
$baseQuery = "select \$object from <#ri> where <info:fedora/$PID> <http://$APP_HOST/fedora/objects/wayne:WSUDOR-Fedora-Relations/datastreams/RELATIONS/content/hasSecurityPolicy> \$object;";

$concatURL = $baseURL.$queryOptions.urlencode($baseQuery);
$results = file_get_contents($concatURL);
$decoded_results = json_decode($results);
// print_r($decoded_results);

if (count($decoded_results->results) === 0 ){		
	$proxyRequire = "true";
}

else{
	$exploded = explode("/", $decoded_results->results[0]->object);	

	if ($exploded[1] === "wayne:WSUDORSecurity-permit-apia-WSUComm"){
		$proxyRequire = "true";
	}
	if ($exploded[1] === "wayne:WSUDORSecurity-permit-apia-unrestricted"){
		$proxyRequire = "false";
	}
}

//if Proxy required
if ($proxyRequire === "true"){

	//get current URL
	function curPageURL() {
	 $pageURL = 'http';
	 if ($_SERVER["HTTPS"] == "on") {$pageURL .= "s";}
	 $pageURL .= "://";
	 if ($_SERVER["SERVER_PORT"] != "80") {
	  $pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
	 } else {
	  $pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
	 }
	 return $pageURL;
	}

	//startswith / endswith functions
	function startsWith($haystack, $needle)
	{
	    return strpos($haystack, $needle) === 0;
	}
	function endsWith($haystack, $needle)
	{
	    return substr($haystack, -strlen($needle)) == $needle;
	}

	//checks IP range
	if ( startsWith($clientIP, $WSUIP) || startsWith($clientIP, $WSUIP_wireless) || startsWith($clientIP, $WSUIP_med) ) {
		$auth_status = "allow";
	}
	else{
		$auth_status = "deny";	
	}

	//checks if running off proxied URL
	if ($clientIP == $proxyIP){
		$img_rewrite = "true";
	}
	else{
		$img_rewrite = "false";
	}
}


//no Proxy require
else{
	$auth_status = "allow";
	$img_rewrite = "false";
}

?>