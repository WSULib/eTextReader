<html>
<title>Image Capture Table</title>
<head>

    <script type="text/javascript" language="javascript" src="https://code.jquery.com/jquery-1.12.4.js"></script>
    <script type="text/javascript" language="javascript" src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.min.js"></script>
    <script type="text/javascript" language="javascript" src="https://cdn.datatables.net/1.10.16/js/dataTables.bootstrap4.min.js"></script>
    <script type="text/javascript" language="javascript" src="https://cdn.datatables.net/responsive/2.2.1/js/dataTables.responsive.min.js"></script>
    <script type="text/javascript" language="javascript" src="https://cdn.datatables.net/responsive/2.2.1/js/responsive.bootstrap4.min.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0/css/bootstrap.css">
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.16/css/dataTables.bootstrap4.min.css">
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/responsive/2.2.1/css/responsive.bootstrap4.min.css">
    <script>
        $(document).ready(function() {
            $('#example').DataTable();

        });

    </script>

</head>

<?php
require("config/config.php");

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$pdo = new \PDO($dsn, $user, $pass);

$sql = "SELECT * from images";
$result = $pdo->query($sql);
?>

<header style="padding-top:15px; padding-bottom:25px; padding-left:15px">
<h2>Image Capture Table</h2>
<p style="position: relative;font-size: 75%;">table shows the screenshots taken using the Image Capture Tool and the data that is currently stored in the database.</p>
</header>
<table id="example" class="table table-striped table-bordered dt-responsive nowrap" style="width:100%">
    <thead>
        <tr>
            <th>id</th>
            <th>URL</th>
            <th>PID</th>
            <th>Page Number</th>
            <th>Coordinates</th>
            <th>Timestamp</th>
        </tr>
    </thead>
    <tbody>
        <?php
        foreach ($result as $row) {
            echo "<tr>";
            echo "<td>".$row['id']."</td>";
            echo "<td><a href=".$row['URL'].">".$row['URL']."</a></td>";
            echo "<td>".$row['PID']."</td>";
            echo "<td>".$row['PageNum']."</td>";
            echo "<td>".$row['Coordinates']."</td>";
            echo "<td>".$row['Timestamp']."</td>";
            echo "</tr>";
        }
        ?>
    </tbody>
</table>

</html>