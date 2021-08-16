const USER = 0;
const ADMIN = 1;

const groups = [];

//PERMISSIONS
// canAddClient - A user's ability to add a client to the system.
// canEditClient - A user's ability to edit a client already in the system.

// Implicitly deny users all access beyond reading
groups[USER] = {

}

groups[ADMIN] = {
    canAddClient: true,
    canEditClient: true,
    canDeleteClient: true,
    canAddContainer: true,
    canDeleteContainer: true
}

groups[USER] = {

}

module.exports = {
    groups: groups
}
