const username = document.getElementById("username");
const password = document.getElementById("password");
const loginButton = document.getElementById("login");
const loginMessage = document.getElementById("login-message");
const defaultLoginMessage = "Please log in to continue.";
loginMessage.innterText = defaultLoginMessage;
let refreshToken = "";
let accessToken = "";
let expires;

window.addEventListener("keydown", (e)=>{
    if (e.key == "Enter"){
        if (document.activeElement == username){
            password.focus();
            return;
        }

        if (document.activeElement == password){
            loginButton.focus();
            return;
        }
    }
});

function login(){
    username.disabled = true;
    password.disabled = true;
    loginButton.disabled = true;
    loginMessage.innerText = "Please wait...";
    const form = {
        "user": username.value,
        "pass": password.value
    }
    $.ajax({
        type: "POST",
        url: "/login",
        data: JSON.stringify(form),
        contentType: "application/json",
        dataType: "json",
        complete: (response)=>{
            username.disabled = false;
            password.disabled = false;
            loginButton.disabled = false;
            switch(response.status){
                case 400:{
                    loginMessage.innerText="Please provide a valid username/password.";
                }
                break;

                case 404:{
                    loginMessage.innerText="This username does not exist.";
                }
                break;

                case 403:{
                    loginMessage.innerText="Invalid password. Please contact the IT department to have your password reset if you still cannot log in.";
                }
                break;

                // Successful login
                case 200:{
                    loginMessage.innerText = defaultLoginMessage;
                    refreshToken = response.responseJSON.refreshToken;
                    accessToken = response.responseJSON.accessToken;
                    expires = Date.now() + 600000;
                    document.getElementById("login-interface").style["display"] = "none";
                    //showInterface("client-search");
                    showInterface("container-search");
                    
                }
                break;

                default:{
                    loginMessage.innerText="Internal server error. Please try again later.";
                }
                break;
            }
        }
    });
}

function logOut(){
    $.ajax({
        type: "POST",
        url: "/logOut",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            username.disabled = false;
            password.disabled = false;
            loginButton.disabled = false;
            switch(response.status){
                case 200:{
                    showInterface("login-interface")
                }
                break;

                case 503:{
                    openPopup("Error processing your request, please try again.");
                }
                break;

                default:{
                    openPopup("Error processing your request.");
                    showInterface("login-interface")
                }
                break;
            }
        }
    });
}

const silentSignIn = setInterval(()=>{
    if (refreshToken != ""){
        if (expires < Date.now()){
            $.ajax({
                type: "POST",
                url: "/token",
                data: JSON.stringify({token: refreshToken}),
                contentType: "application/json",
                dataType: "json",
                complete: (response)=>{
                    if (response.status == 200){
                        accessToken = response.responseJSON.accessToken;
                    }else{
                        showInterface("login-interface");
                        refreshToken = "";
                    }
                }
            });
        }
    }
}, 1000)