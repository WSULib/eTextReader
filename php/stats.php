<?php
$PID = $_POST['PID'];
$date = date(DATE_RFC822);
$logline = "$PID,$date\n";
file_put_contents("/var/log/eTextReader/PIDloads.log", $logline, FILE_APPEND);
?>