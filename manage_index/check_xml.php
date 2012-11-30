<?php
//Grab names of folders in directory
$folderName = (glob('/var/www/data/*', GLOB_ONLYDIR));

//Create variable for looping through to search for xml files in each directory
//Right now it just looks for one, but this can be made into a loop
$folderCount = count($folderName);

for ($i = 0; $i < $folderCount; $i++){
	$fileName = $folderName[$i] . "_metadata.xml";
	$xmlFile = $folderName[$i] . '/' . $fileName;
	//Check to see if xml file exists
	if (file_exists($xmlFile)) {echo "The XML file for " . $folderName[$i] . " exists!\n";} 
	else {
		//Get bookID
		$bookID = $folderName[$i];

		//Get page count by counting images in the images folder
		$imgPath = $folderName[$i] . '/images/';
		$pageCount = count(glob($imgPath . "*.*"));

		//Get image dimensions
		$pageOne = $imgPath . 'page00001.jpg';
		$pageSize = getimagesize($pageOne);
		$pHeight = $pageSize[1]; 
		$pWidth = $pageSize[0];

$string = <<<XML

<add>

   <doc>
      <field name="ItemID">$bookID</field>
      <field name="pheight">$pHeight</field>
      <field name="pwidth">$pWidth</field>
      <field name="leafs">$pageCount</field>
   </doc>

</add>
XML;

		$xml = new SimpleXMLElement($string);
		echo $xml->asXML($xmlFile);

		echo "There was no XML file for " . $bookID . " so I made one.\n";
	}
}

?>

