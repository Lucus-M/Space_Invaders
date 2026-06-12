<?php
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    $config = require 'config.php';

    $servername = $config['servername'];
    $username = $config['username'];
    $password = $config['password'];
    $dbname = $config['dbname'];

    //Connect to db
    $conn = new mysqli($servername, $username, $password, $dbname);
 
    //connection error
    if($conn->connect_error){
        die("Connection Failed: " . $conn->connect_error);
    }

    //sql code
    $sql = "SELECT * FROM scores ORDER BY score DESC";

    $result = $conn->query($sql);
 
    //output database data
    if($result->num_rows > 0){
        while($row = $result->fetch_assoc()){
            echo $row["id"]. ", ". $row["initial"]. ", ". $row["score"]. ";";
        }
    } else{
        echo "0 results";
    }

    $conn->close();
?>
