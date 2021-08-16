const USER = 0;
const ADMIN = 1;

const groups = [];

//PERMISSIONS
// canAddClient: true/false
// canEditClient: true/false
// canDeleteClient: true/false
// canAddContainer: true/false
// canEditContainer: true/false
// canDeleteContainer: true/false

// Implicitly deny users all access beyond reading
groups[USER] = {
    // There are no permissions for a standard user, add properties here.
}

groups[ADMIN] = {
    canAddClient: true,
    canEditClient: true,
    canDeleteClient: true,
    canAddContainer: true,
    canEditContainer: true,
    canDeleteContainer: true,
}

groups[USER] = {

}

module.exports = {
    groups: groups
}
