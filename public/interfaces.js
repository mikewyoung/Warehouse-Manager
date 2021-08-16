const interfaces = document.getElementsByClassName("interface");
const subInterfaces = document.getElementsByClassName("sub-interface");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popup-message");
const subInterfaceBG = document.getElementById("sub-bg");
let currentPage = 0; // SQL results will only show in pages of 10.



// Get the default display value so we know how to display them when we unhide them
const defaultValues = [];
for(let i = 0; i < interfaces.length; i++){
    defaultValues[interfaces[i].id] = interfaces[i].style.display;
}

for(let i = 0; i < subInterfaces.length; i++){
    defaultValues[subInterfaces[i].id] = subInterfaces[i].style.display;
    subInterfaces[i].style.display = "none";
}

function showInterface(interfaceID){
    // Close all other interfaces
    for(let i = 0; i < interfaces.length; i++){
        interfaces[i].style.display = "none";
    }

    const shownInterface = document.getElementById(interfaceID);
    shownInterface.style.display = defaultValues[interfaceID];

    // Disable navigation buttons for grids
    const navigationButtons = document.getElementsByClassName("grid-navigation-button");
    for(let i = 0; i < navigationButtons.length; i++){
        navigationButtons[i].disabled = true;
    }

    currentPage = 0;

    if (interfaceID == "client-search"){
        searchClients("", 0);
    }

    if (interfaceID == "container-search"){
        searchContainers(true, 0);
    }
}

function openPopup(message){
    popup.style.display = "flex";
    popupMessage.innerText = message;
}

function closePopup(){
    popup.style.display = "none";
}

// Show the login interface by default
showInterface("login-interface");

function showSubInterface(subInterfaceID){

    subInterfaceBG.style.display = "flex";

    // Close all other sub-interfaces
    for(let i = 0; i < subInterfaces.length; i++){
        subInterfaces[i].style.display = "none";
    }

    // Disable all normal interface input
    for(let i = 0; i < interfaces.length; i++){
        interfaces[i].style.visibility = "hidden";
    }

    const subInterface = document.getElementById(subInterfaceID);

    subInterface.style.display = defaultValues[subInterfaceID];

    switch(subInterfaceID){
        case "add-client":{
            document.getElementById("add-client-name").focus();
        }
        break;
    }


}

function closeSubInterface(){
    subInterfaceBG.style.display = "none";
    // Disable all normal interface input
    for(let i = 0; i < interfaces.length; i++){
        interfaces[i].style.visibility = "visible";
    }
}