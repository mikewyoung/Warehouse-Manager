//const searchButton = document.getElementById("search-clients-button");
const searchContainerNumberBar = document.getElementById("search-containers-number");
const searchContainerCatalogBar = document.getElementById("search-containers-catalog");
const searchContainerClientBar = document.getElementById("search-containers-client");
const searchContainersButton = document.getElementById("search-containers-button");
let lastSearchedClient = "";
let lastSearchedContainerNumber = 0;
let lastSearchedCatalog = "";
let currentContainerPage = 0;
let editingContainer = -1;

function searchContainers(resetPage, page){

    const clientName = searchContainerClientBar.value;
    const containerNumber = searchContainerNumberBar.value;
    const containerCatalog = searchContainerCatalogBar.value;

    searchContainersButton.disabled = true;

    if(resetPage == true) currentContainerPage = 0;

    page = page || 0;

    currentContainerPage = page;

    // For navigation buttons
    lastSearched = clientName;
    lastSearchedContainerNumber = containerNumber;
    lastSearchedCatalog = containerCatalog;

    $.ajax({
        type: "POST",
        url: "/searchcontainers",
        data: JSON.stringify({clientName: clientName, page: page, number: containerNumber, catalog: containerCatalog}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            searchContainersButton.disabled = false;
            switch (response.status){
                case 200:{
                    const searchResults = document.getElementById("container-search-results");
                    searchResults.innerHTML = "";
                    const results = response.responseJSON.result;
                    
                    const buttons = document.getElementsByClassName("grid-navigation-button");
                    for(let i = 0; i < buttons.length; i++){
                        if (buttons[i].classList.contains("next") && results.length < 11){
                            buttons[i].disabled = true;
                        }else{
                            if (buttons[i].classList.contains("previous") && currentContainerPage == 0){
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

                        const containerNumber = document.createElement("div");
                        containerNumber.innerText = result.number;
                        newResult.appendChild(containerNumber);

                        const containerClient = document.createElement("div");
                        containerClient.innerText = result.name;
                        newResult.appendChild(containerClient);

                        const containerLocationCode = document.createElement("div");
                        containerLocationCode.innerText = "S" + result.phase + "A" + result.aisle + "C" + result.col + "L" + result.level;
                        newResult.appendChild(containerLocationCode);

                        const editButton = document.createElement("button");
                        editButton.classList.add("small-button");
                        editButton.innerText = "View/Edit";
                        editButton.onclick = ()=>{
                            openEditContainer(result.name, result.catalog, result.phase, result.aisle, result.col, result.level, result.number);
                        }

                        const deleteButton = document.createElement("button");
                        deleteButton.innerText = "Delete";
                        deleteButton.classList.add("small-button");
                        deleteButton.onclick = ()=>{
                            openDeleteContainerConfirmation(result.number, result.name);
                        }

                        const operations = document.createElement("div");
                        operations.classList.add("flex", "justify-center", "gap-10");
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

function addContainer(){
    const clientName = document.getElementById("container-client-name").value;
    const phase = document.getElementById("add-container-phase").value;
    const aisle = document.getElementById("add-container-aisle").value;
    const column = document.getElementById("add-container-column").value;
    const level = document.getElementById("add-container-level").value;
    const catalog = document.getElementById("add-container-catalog").value;

    $.ajax({
        type: "POST",
        url: "/addContainer",
        data: JSON.stringify({clientName: clientName, phase: parseInt(phase), aisle: parseInt(aisle), column: parseInt(column), level: parseInt(level), catalog: catalog}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            switch (response.status){
                case 200:{
                    closeSubInterface();
                    openPopup("Successfully added container Box #" + response.responseJSON.boxNo);
                    // Clear the inputs
                    document.getElementById("add-container-phase").value = "";
                    document.getElementById("container-client-name").value = "";
                    document.getElementById("add-container-aisle").value = "";
                    document.getElementById("add-container-column").value = "";
                    document.getElementById("add-container-level").value = "";
                    document.getElementById("add-container-catalog").value = "";
                    searchContainers(false, currentContainerPage);
                }
                break;

                case 503:{
                    openPopup("There was an error processing your request.");
                }
                break;

                case 400:{
                    openPopup("Please enter a name and specify a location.");
                }
                break;

                case 404:{
                    openPopup("That client does not exist.");
                }
                break;


                case 401:{
                    openPopup("Your account does not have permission to add a container.");
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

function editContainer(){
    const number = editingContainer;
    const phase = document.getElementById("edit-container-phase").value;
    const aisle = document.getElementById("edit-container-aisle").value;
    const column = document.getElementById("edit-container-column").value;
    const level = document.getElementById("edit-container-level").value;
    const catalog = document.getElementById("edit-container-catalog").value;

    $.ajax({
        type: "POST",
        url: "/editContainer",
        data: JSON.stringify({number: number, phase: parseInt(phase), aisle: parseInt(aisle), column: parseInt(column), level: parseInt(level), catalog: catalog}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            switch (response.status){
                case 200:{
                    closeSubInterface();
                    openPopup("Successfully edited container " + editingContainer);
                    searchContainers(false, currentContainerPage);
                }
                break;

                case 503:{
                    openPopup("There was an error processing your request.");
                }
                break;

                case 400:{
                    openPopup("Please specify a location.");
                }
                break;

                case 404:{
                    openPopup("That client does not exist.");
                }
                break;


                case 401:{
                    openPopup("Your account does not have permission to edit a container.");
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
        switch(document.activeElement){
            case searchContainerNumberBar:{
                searchContainerCatalogBar.focus();
            }
            break;

            case searchContainerCatalogBar:{
                searchContainerClientBar.focus();
            }
            break;

            case searchContainerClientBar:{
                searchContainersButton.focus();
            }
            break;
        }
    }
})

function showNextContainerPage(){
    currentContainerPage++;
    searchContainers(lastSearched, currentContainerPage);
}


function showPreviousContainerPage(){
    currentContainerPage--;
    if (currentContainerPage < 0) currentContainerPage = 0;

    searchContainers(lastSearched, currentContainerPage);
}

function openEditContainer(name, catalog, phase, aisle, column, level, number){
    editingContainer = number;
    const catalogInput = document.getElementById("edit-container-catalog");
    const phaseInput = document.getElementById("edit-container-phase");
    const aisleInput = document.getElementById("edit-container-aisle");
    const columnInput = document.getElementById("edit-container-column");
    const levelInput = document.getElementById("edit-container-level");
    const clientName = document.getElementById("edit-container-name");
    const containerNumber = document.getElementById("edit-container-number");
    clientName.innerText="Owner: " + name;
    containerNumber.innerText = "Container No. " + number;
    catalogInput.value = catalog;
    phaseInput.value = phase;
    aisleInput.value = aisle;
    columnInput.value = column;
    levelInput.value = level;

    showSubInterface("edit-container");
}

function openDeleteContainerConfirmation(number, name){
    const deleteInterface = document.getElementById("delete-container-confirmation");
    deleteInterface.getElementsByTagName("h2")[0].innerText = "Are you sure you want to delete container " + number + " for client " + name + "? This CANNOT be undone.";
    deleteInterface.getElementsByTagName("button")[0].onclick = ()=>{
        deleteContainer(number);
    }
    showSubInterface("delete-container-confirmation")
}

function deleteContainer(number){
    $.ajax({
        type: "POST",
        url: "/deleteContainer",
        data: JSON.stringify({number: number}),
        contentType: "application/json",
        dataType: "json",
        headers:{
            "Authorization": "Bearer " + accessToken
        },
        complete: (response)=>{
            switch (response.status){
                case 200:{
                    closeSubInterface();
                    openPopup("Deleted container " + number + " successfully.");
                    // Re-run query
                    searchContainers(false, currentContainerPage);
                }
                break;

                case 503:{
                    openPopup("There was a problem deleting the container. Please contact the IT department if this issue persists.");
                }
                break;

                case 401:{
                    openPopup("Your account does not have permission to delete a container.");
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