# Warehouse Manager
 
This is an app for adding, managing, and deleting containers and clients for a document storage warehouse.

The front end is written in plain HTML/CSS, Javascript/jquery and CSS, and the backend is written in Javascript with Node.js.

Authentication is handled with json webtoken and passwords are securely hashed using bcrypt.

Users can be added by running the command in node createUser(username, password, first name, last name, user group) with usergroups being 0 for administrator and 1 for standard user that can only read. Further usergroups and permissions can be added in the usergroups.js file.