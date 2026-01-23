<?php
$conn = mysqli_connect("localhost", "root", "", "cbc");
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$result = mysqli_query($conn, "SHOW TABLES LIKE 'cache_%'");
while ($row = mysqli_fetch_row($result)) {
    $table = $row[0];
    mysqli_query($conn, "TRUNCATE TABLE $table");
}

mysqli_close($conn);
echo "Database caches cleared.\n";
