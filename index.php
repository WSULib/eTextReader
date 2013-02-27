<html>
<head>
	<!-- kube stylesheet -->
	<link rel="stylesheet" type="text/css" href="../css/kube101/css/kube.css" />
	<!-- local stylesheet -->
	<link rel="stylesheet" href="../css/blauncher.css" type="text/css">
</head>

<body>

<div id="container">

	<div id="title" class="row">
		<h3>WSU eReader - Ramsey Collection example books</h3>
	</div>

	<div id='item_thumbs'>
		<?php

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		function createThumb($item_ID){
			echo "<div class='fifth'><a href='bookreader.htm?ItemID=ramsey:$item_ID#page/1/mode/2up'><img class='shadow' src='../data/$item_ID/".$item_ID."_cover.jpg'/></a>";
			echo 	"<div class='row container'>";
	        echo 		"<div class='thumb_text'><em>$item_ID</em></div>";			          
			echo 	"</div>";
			echo "</div>";
		}
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		$item_list = scandir('../data');
		// print_r($item_list);

		$i = 0;
		foreach ($item_list as $item_ID) {
			if ($item_ID == "." || $item_ID == "..") {
				continue;
			}
			else {				
				if ($i == 0) {
					echo "<div class='row'>";
				}
				createThumb($item_ID);
				++$i; // moves counter
				if ($i == 5) {
					$i = 0;
					echo "</div>";
				}
			}
		}

		?>
	</div>

</div>

</body>
</html>