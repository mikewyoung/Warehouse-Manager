const searchButton = document.getElementById("search-clients-button");
const searchClientBar = document.getElementById("search-clients");
let lastSearched;

function searchClients(resetPage, page){

    const clientName = searchClientBar.value;

    searchButton.disabled = true;

    if(resetPage == true) currentPage = 0;

    page = page || 0;

    currentPage = page;

    // For navigation buttons
    lastSearched = clientName;

    $.ajax({
        type: "POST",
        url: "/searchclients",
        data: JSON.stringify({clientName: clientName, page: page}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            searchButton.disabled = false;
            switch (response.status){
                case 200:{
                    const searchResults = document.getElementById("client-search-results");
                    searchResults.innerHTML = "";
                    const results = response.responseJSON.result;
                    
                    const buttons = document.getElementsByClassName("grid-navigation-button");
                    for(let i = 0; i < buttons.length; i++){
                        if (buttons[i].classList.contains("next") && results.length < 11){
                            buttons[i].disabled = true;
                        }else{
                            if (buttons[i].classList.contains("previous") && currentPage == 0){
                                buttons[i].disabled = true;
                            }else{
                                buttons[i].disabled = false;
                            }
                        }
                    }

                    if (results.length > 10){
                        results.length = 10;
                    }

                    results.forEach((result)=>{
                        const newResult = document.createElement("div");
                        newResult.id = result.id;
                        newResult.classList.add("search-result");
                        newResult.style["grid-template-columns"] = "2fr 2fr 2fr 1fr";

                        const name = document.createElement("div");
                        name.innerText = result.name;
                        newResult.appendChild(name);

                        const email = document.createElement("div");
                        email.innerText = result.email;
                        newResult.appendChild(email);

                        const phone = document.createElement("div");
                        phone.innerText = result.phone;
                        newResult.appendChild(phone);

                        const operations = document.createElement("div");
                        operations.classList.add("flex", "justify-center", "gap-10");

                        const editButton = document.createElement("button");
                        editButton.classList.add("small-button");
                        editButton.innerText = "Edit";
                        editButton.onclick = ()=>{
                            openEditClient(result.name, result.email, result.phone, result.id);
                        }

                        const deleteButton = document.createElement("button");
                        deleteButton.innerText = "Delete";
                        deleteButton.classList.add("small-button");
                        deleteButton.onclick = ()=>{
                            openDeleteConfirmation(result.name, result.id);
                        }
                        operations.appendChild(editButton);
                        operations.appendChild(deleteButton);
                        newResult.appendChild(operations);

                        searchResults.appendChild(newResult);
                    })
                }
                break;

                case 503:{
                    openPopup("There was a DB error processing your request. Contact the IT department if this persists.");
                }
                break;

                default:{
                    showInterface("login-interface");
                    openPopup("Invalid request.");
                }
                break;
            }
        }
    });
}

function addClient(){
    const nameInput = document.getElementById("add-client-name");
    const emailInput = document.getElementById("add-client-email");
    const phoneInput = document.getElementById("add-client-phone");
    const name = nameInput.value
    const email = emailInput.value;
    const phone = phoneInput.value;

    $.ajax({
        type: "POST",
        url: "/addClient",
        data: JSON.stringify({clientName: name, clientEmail: email, clientPhone: phone}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            switch (response.status){
                case 200:{
                    closeSubInterface();
                    openPopup("Added " + name + " successfully.");
                    // Clear the inputs
                    nameInput.value = "";
                    emailInput.value = "";
                    phoneInput.value = "";
                }
                break;

                case 503:{
                    openPopup("That company already exists.");
                }
                break;

                case 401:{
                    openPopup("Your account does not have permission to add a new client.");
                }
                break;

                case 400:{
                    openPopup("Please enter a client name.");
                }
                break;

                default:{
                    closeSubInterface();
                    showInterface("login-interface");
                    openPopup("Invalid request.");
                }
                break;
            }
        }
    });
}

function editClient(){
    const nameInput = document.getElementById("edit-client-name");
    const emailInput = document.getElementById("edit-client-email");
    const phoneInput = document.getElementById("edit-client-phone");
    const name = nameInput.value
    const email = emailInput.value;
    const phone = phoneInput.value;

    $.ajax({
        type: "POST",
        url: "/editClient",
        data: JSON.stringify({clientName: name, clientEmail: email, clientPhone: phone, id: editingClient}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            switch (response.status){
                case 200:{
                    closeSubInterface();
                    openPopup("Edited " + name + " successfully.");
                    // Clear the inputs
                    nameInput.value = "";
                    emailInput.value = "";
                    phoneInput.value = "";

                    // Re-run query
                    searchClients(false, currentPage);
                }
                break;

                case 503:{
                    openPopup("There was a problem editing the client. The company name you provided is most likely already in use. If you believe this is in error, contact the IT department.");
                }
                break;

                case 401:{
                    openPopup("Your account does not have permission to edit a client's information.");
                }
                break;

                default:{
                    closeSubInterface();
                    showInterface("login-interface");
                    openPopup("Invalid request.");
                }
                break;
            }
        }
    });
}

window.addEventListener("keydown", (e)=>{
    if (e.key == "Enter"){
        if (document.activeElement == searchClientBar){
            searchButton.focus();
        }
    }
})

function showNextClientPage(){
    currentPage++;
    searchClients(lastSearched, currentPage);
}


function showPreviousClientPage(){
    currentPage--;
    if (currentPage < 0) currentPage = 0;

    searchClients(lastSearched, currentPage);
}

function openEditClient(name, email, phone, id){
    editingClient = id;
    const nameInput = document.getElementById("edit-client-name");
    const emailInput = document.getElementById("edit-client-email");
    const phoneInput = document.getElementById("edit-client-phone");
    nameInput.value = name;
    emailInput.value = email;
    phoneInput.value = phone;

    showSubInterface("edit-client");
}

function openDeleteConfirmation(name, id){
    const deleteInterface = document.getElementById("delete-client-confirmation");
    deleteInterface.getElementsByTagName("h2")[0].innerText = "Are you sure you want to delete " + name + "? This CANNOT be undone.";
    deleteInterface.getElementsByTagName("button")[0].onclick = ()=>{
        deleteClient(name, id);
    }
    showSubInterface("delete-client-confirmation")
}

function deleteClient(name, id){
    $.ajax({
        type: "POST",
        url: "/deleteClient",
        data: JSON.stringify({id: id}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            switch (response.status){
                case 200:{
                    closeSubInterface();
                    openPopup("Deleted " + name + " successfully.");
                    // Re-run query
                    searchClients(false, currentPage);
                }
                break;

                case 503:{
                    openPopup("There was a problem deleting the client. Please contact the IT department if this issue persists.");
                }
                break;

                case 401:{
                    openPopup("Your account does not have permission to delete a client.");
                }
                break;

                default:{
                    closeSubInterface();
                    showInterface("login-interface");
                    openPopup("Invalid request.");
                }
                break;
            }
        }
    });
}

// Add autocomplete to name input
function autoCompleteClientNames(name){
    const clientNames = document.getElementById("client-names");
    $.ajax({
        type: "POST",
        url: "/requestClientNames",
        data: JSON.stringify({clientName: name}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            switch (response.status){
                case 200:{
                    const results = response.responseJSON.results;

                    clientNames.innerHTML = "";
                    results.forEach((result)=>{
                        const option = document.createElement("option");
                        option.value = result.name;
                        clientNames.appendChild(option);
                    })
                }
                break;
            }
        }
    });
}

document.getElementById("container-client-name").oninput = ()=>{
    autoCompleteClientNames(document.getElementById("container-client-name").value);
}