<?php
//Grab names of folders in directory
$folderName = (glob('/var/www/data/*', GLOB_ONLYDIR));
print_r($folderName);

array_slice(glob('/var/www/data/crit_example/images/*.*'), 0, 5);

//print_r($image);
?>

