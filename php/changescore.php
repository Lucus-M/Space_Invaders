<?php
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    $config = require 'config.php';

    $servername = $config['servername'];
    $username = $config['username'];
    $password = $config['password'];
    $dbname = $config['dbname'];

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $rowsResult = $conn->query("SELECT * FROM scores;");

    echo " rows:". mysqli_num_rows($rowsResult);

    $id = mysqli_num_rows($rowsResult) + 1; //id = number of rows in table + 1
    $score = $_POST["score"];
    $initials = $_POST["initial"];

    //regex match
    $regex_pattern = "/^[A-Z\s]+$/";


    echo strlen($initials);
    echo is_null($initials);

    echo $id;
    echo $score;
    echo $initials;

    //Validate data, must be no more than 3 characters and only uppercase letters and spaces
    if(strlen($initials) > 3 || !preg_match($regex_pattern, $initials) || is_null($initials)){
        echo("ERROR ");
        die("Invalid Input.");
    }

    echo " writing to db...";
    
    $sql = "INSERT INTO scores (id, initial, score)
            VALUES ('$id', '$initials', '$score');";
    $conn->query($sql);
    
?>