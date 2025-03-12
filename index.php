<!DOCTYPE html>
<html lang="en-US">
    <head>
        <title>SPACE INVADERS</title>
        <link rel="icon" type="image/x-icon" href="icon.png">
        <link rel="stylesheet" href="style.css">
    </head>
    <body style="color: white; background-color: black">
        <!--
            <div id="infoDisplay">
            <p>&ltSCORE&gt</p>
            <p id="score"> 0000</p>

            <p><br>Invaders Alive</p>
            <p id="invadersAliveDisplay"> 0000</p>

            <p><br>Moving:</p>
            <p id="movingDisplay"> 0000</p>

            <p><br>UFO timer:</p>
            <p id="ufoTimer"> 0000</p>

            <p><br>Shot Number:</p>
            <p id="shotNumber"> 0000</p>
        </div>
        -->

        <header>
            <h1>SPACE INVADERS</h1>
        </header>

        <form id="formid"></form>
        
        <section id="modal">
            <div id="modalContents">
                <button onclick="document.getElementById('modal').style.display='none'; inModal=false">Close</button>
                <h2>CONGRATULATIONS!</h2>
                <p>You've made it onto the scoreboard!</p>
                <p>Please enter your initials below and hit "Submit".</p>
                <p>(Uppercase letters only, no more than 3 characters)</p>
                <input type="text" id="initials" name="initials" form="formid" oninput="validateForm()">
                <input type="button" id="submit" value="Submit" form="formid" style="visibility: visible;">
            </div>
        </section>
        
        <div id="contentContainer">
            <canvas id="cvs" width="224" height="260"></canvas>
        </div>

        <footer>
            <p>Controls- Movement: Arrow Keys; Shoot: Z/Spacebar</p>
            <p>&copy; Taito 1978, Programmed by Lucus Mulhorn</p>
        </footer>
    </body>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

    <script src="js/gfx.js"></script>
    <script src="js/sounds.js"></script>
    <script src="js/script.js"></script>

    <script>
        //client side form validation
        function validateForm(){
            //console.log("change");
            if(!$('#initials').val().match(/^[A-Z\s]+$/) || $('#initials').val().length > 3){
                document.getElementById("submit").style.visibility = "hidden";
                //console.log("hide");
            }
            else{
                document.getElementById("submit").style.visibility = "visible";
                //console.log("show");
            }

        }
    </script>
</html>