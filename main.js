const express = require("express");
const app = express();
const port = process.env.PORT;
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usergroups = require("./usergroups.js");


// For .env debugging.
require("dotenv").config();

const pool = mysql.createPool({
    connectionLimit: 3,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DB,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS
})


pool.query("CREATE TABLE IF NOT EXISTS users(username VARCHAR(16) PRIMARY KEY, password CHAR(60), firstname VARCHAR(25), lastname VARCHAR(25), usergroup TINYINT UNSIGNED)");
pool.query("CREATE TABLE IF NOT EXISTS tokens(username VARCHAR(16) PRIMARY KEY, token VARCHAR(200))")
pool.query("CREATE TABLE IF NOT EXISTS clients(id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(30), phone VARCHAR(15), email varchar(50), UNIQUE(name) )");
pool.query("CREATE TABLE IF NOT EXISTS containers(number INT AUTO_INCREMENT PRIMARY KEY, clientID INT, phase TINYINT UNSIGNED, aisle TINYINT UNSIGNED, col SMALLINT UNSIGNED, level TINYINT UNSIGNED, catalog TEXT)");


app.use(express.static("public"));
app.use(express.json());

app.post("/token", (req, res) =>{
    const refreshToken = req.body.token;
    if (typeof refreshToken != "string"){
        res.sendStatus(400);
        return;
    }

    pool.query("SELECT * FROM tokens WHERE token = ?", [refreshToken], (err, result)=>{
        if (err){
            console.log(err);
            res.sendStatus(503);
            return;
        }

        if (result.length == 0){
            res.sendStatus(403);
            return;
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user)=>{
            if (err){
                res.sendStatus(403);
                return;
            }

            const accessToken = generateAccessToken({name: user.username, usergroup: user.usergroup});
            res.status(200).json({accessToken: accessToken});
        })
    });
});

app.post("/searchclients", authenticateToken, (req, res)=>{
    const clientName = req.body.clientName;
    const page = req.body.page;
    if (typeof clientName != "string"){
        res.sendStatus(400);
        return;
    }

    if (typeof page != "number"){
        res.sendStatus(400);
        return;
    }

    if (page < 0) page = 0;

    const offset = page * 10;

    pool.query("SELECT * FROM clients WHERE name LIKE ? LIMIT 11 OFFSET ?", ["%" + clientName + "%", offset], (err, result)=>{
        if (err){
            res.sendStatus(503);
            console.log(err)
            return;
        }

        res.status(200).json(
            {result: result}
        );

    })
} )

app.post("/searchcontainers", authenticateToken, (req, res)=>{
    const clientName = req.body.clientName;
    const catalog = req.body.catalog;
    const number = req.body.number || "";
    const page = req.body.page;

    if (typeof clientName != "string" || typeof catalog != "string" || typeof number != "string"){
        res.sendStatus(400);
        return;
    }

    if (typeof page != "number"){
        res.sendStatus(400);
        return;
    }

    if (page < 0) page = 0;

    const offset = page * 10;

    pool.query("select containers.clientID, containers.catalog, containers.number, clients.name, containers.phase, containers.aisle, containers.col, containers.level FROM clients INNER JOIN containers on clients.id = containers.clientID WHERE clients.name LIKE ? AND containers.catalog LIKE ? AND containers.number LIKE ? ORDER BY number ASC LIMIT 11 OFFSET ?", ["%" + clientName + "%", "%" + catalog + "%", "%" + number + "%", offset], (err, result)=>{
        if (err){
            res.sendStatus(503);
            console.log(err)
            return;
        }

        res.status(200).json(
            {result: result}
        );

    })
} )

app.post("/addClient", authenticateToken, (req, res)=>{
    const clientName = req.body.clientName;
    const clientEmail = req.body.clientEmail;
    const clientPhone = req.body.clientPhone;
    if (typeof clientName != "string" || clientName == ""){
        res.sendStatus(400);
        return;
    }

    if (typeof clientEmail != "string"){
        res.sendStatus(400);
        return;
    }

    if (typeof clientPhone != "string"){
        res.sendStatus(400);
        return;
    }

    if (usergroups.groups[req.user.usergroup].canAddClient != true){
        res.sendStatus(401);
        return;
    }

    pool.query("INSERT INTO clients(name, email, phone) VALUES(?, ?, ?)", [clientName, clientEmail, clientPhone],(err)=>{
        if (err){
            res.sendStatus(503);
            return;
        }

        console.log(req.user.username + " added " + clientName + " to clients DB.");
        res.sendStatus(200);
        return;
    })
});

app.post("/deleteClient", authenticateToken, (req, res)=>{
    const id = req.body.id;

    if (typeof id != "number"){
        res.sendStatus(400);
        return;
    }

    if (usergroups.groups[req.user.usergroup].canDeleteClient != true){
        res.sendStatus(401);
        return;
    }

    pool.query("DELETE FROM clients WHERE id = ?", [id], (err)=>{
        if (err){
            res.sendStatus(503);
            console.log(err);
            return;
        }

        console.log(req.user.username + " deleted client ID " + id);
        res.sendStatus(200);

        // Delete all containers belonging to this client
        pool.query("DELETE FROM containers WHERE clientID = ?", [id]);
    })
})

app.post("/editClient", authenticateToken, (req, res)=>{
    const clientName = req.body.clientName;
    const clientEmail = req.body.clientEmail;
    const clientPhone = req.body.clientPhone;
    const id = req.body.id;
    if (typeof clientName != "string"){
        res.sendStatus(400);
        return;
    }

    if (typeof clientEmail != "string"){
        res.sendStatus(400);
        return;
    }

    if (typeof clientPhone != "string"){
        res.sendStatus(400);
        return;
    }

    if (typeof id != "number"){
        res.sendStatus(400);
        return;
    }

    if (usergroups.groups[req.user.usergroup].canDeleteClient != true){
        res.sendStatus(401);
        return;
    }

    pool.query("UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?", [clientName, clientEmail, clientPhone, id], (err)=>{
        if (err){
            res.sendStatus(503);
            console.log(err);
            return;
        }
        console.log(req.user.username + " updated " + clientName + " information.");
        res.sendStatus(200);
    });


});

app.post("/editContainer", authenticateToken, (req, res)=>{
    const number = req.body.number;
    const catalog = req.body.catalog;
    const phase = req.body.phase;
    const aisle = req.body.aisle;
    const column = req.body.column;
    const level = req.body.level;

    if (typeof number != "number" || typeof phase != "number" || typeof aisle != "number" || typeof column != "number" || typeof level != "number" || typeof catalog != "string"){
        res.sendStatus(400);
        return;
    }

    if (usergroups.groups[req.user.usergroup].canEditContainer != true){
        res.sendStatus(401);
        return;
    }

    pool.query("UPDATE containers SET catalog = ?, phase = ?, aisle = ?, col = ?, level = ? WHERE number = ?", [catalog, phase, aisle, column, level, number], (err)=>{
        if (err){
            res.sendStatus(503);
            console.log(err);
            return;
        }
        console.log(req.user.username + " updated box no. " +number+ " information.");
        res.sendStatus(200);
    });


});


app.post("/requestClientNames", authenticateToken, (req, res)=>{
    const clientName = req.body.clientName;

    if (typeof clientName != "string"){
        res.sendStatus(400);
        return;
    }

    pool.query("SELECT name FROM clients WHERE name LIKE ? LIMIT 10", ["%" + clientName + "%"], (err, result)=>{
        if (err){
            res.sendStatus(503);
            return;
        }

        res.status(200).json({results: result});
    })
});

app.post("/addContainer", authenticateToken, (req, res)=>{
    const clientName = req.body.clientName;
    const phase = req.body.phase;
    const aisle = req.body.aisle;
    const column = req.body.column;
    const level = req.body.column;
    const catalog = req.body.catalog;

    if (typeof clientName != "string" || typeof phase != "number" || typeof aisle != "number" || typeof column != "number" || typeof level != "number" || typeof catalog != "string"){
        res.sendStatus(400);
        return;
    }

    if (usergroups.groups[req.user.usergroup].canAddContainer != true){
        res.sendStatus(401);
        return;
    }

    // Make sure this container is targeting an actual client.
    pool.query("SELECT id FROM clients WHERE name = ?", [clientName], (err, result)=>{
        if (err){
            res.sendStatus(503);
            return;
        }

        if (result.length != 1){
            console.log(result.length)
            res.sendStatus(404);
            return;
        }

        const clientID = result[0].id;

        pool.query("INSERT INTO containers (clientID, phase, aisle, col, level, catalog, status) VALUES(?, ?, ?, ?, ?, ?, ?)", [clientID, phase, aisle, column, level, catalog, true], (err, result)=>{
            if (err){
                res.sendStatus(503);
                return;
            }

            console.log(req.user.username + " added a container for client ID " + clientID);

            res.status(200).json({boxNo: result.insertId});
            return;
        })

        
    })
});

app.post("/deleteContainer", authenticateToken, (req, res)=>{
    const number = req.body.number;

    if (typeof number != "number"){
        res.sendStatus(400);
        return;
    }

    if (usergroups.groups[req.user.usergroup].canDeleteContainer != true){
        res.sendStatus(401);
        return;
    }

    pool.query("DELETE FROM containers WHERE number = ?", [number], (err)=>{
        if (err){
            res.sendStatus(503);
            console.log(err);
            return;
        }

        console.log(req.user.username + " deleted container " + number);
        res.sendStatus(200);
        return;
    })
})

app.post("/login", (req, res)=>{
    const username = req.body.user;
    const password = req.body.pass;

    if (typeof username != "string" || typeof password != "string"){
        res.sendStatus(400);
        return;
    }

    pool.query("SELECT * FROM users WHERE username = ?", [username], (err, result)=>{
        if (err){
            res.sendStatus(503);
            return;
        }

        if (result.length == 0){
            res.sendStatus(404);
            return;
        }

        const foundUser = result[0];

        bcrypt.compare(password, foundUser.password, (err, isMatch)=>{
            if (err){
                res.sendStatus(500);
                return;
            }

            if (isMatch == true){
                // Authenticate user
                const user = {
                    username: foundUser.username,
                    usergroup: foundUser.usergroup,
                    expires: Date.now() + 86400000
                }
                const accessToken = generateAccessToken(user);
                const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
                // Add a new refresh token to the DB and invalidate any others.
                pool.query("INSERT INTO tokens(username, token) VALUES(?, ?) ON DUPLICATE KEY UPDATE token=?", [foundUser.username, refreshToken, refreshToken], (err)=>{
                    if (err){
                        console.log(err);
                        res.sendStatus(503);
                        return;
                    }
                    res.status(200).json({accessToken: accessToken, refreshToken: refreshToken});
                });
            }else{
                res.sendStatus(403);
                return;
            }
        });
    })
});

app.post("/logOut", authenticateToken, (req, res)=>{
    pool.query("DELETE FROM tokens WHERE username = ?", [req.user.username], (err)=>{
        if (err) {
            console.log(err);
            res.sendStatus(503);
        }

        res.sendStatus(200);
    })
})

app.listen(port, (err)=>{
    if (err){
        console.log("Error listening on port " + port);
        throw err;
    }else{
        console.log("Listening on port " + port);
    }
})

function createUser(username, password, firstname, lastname, usergroup){
    if (username.length > 16){
        console.log("Username must be less than 16 characters")
        return;
    }

    if (password.length > 50){
        console.log("Password must not be longer than 50 characters")
        return;
    }
    const saltRounds = 10;
    bcrypt.genSalt(saltRounds, (err, salt)=>{
        if (err){
            throw err;
        }

        bcrypt.hash(password, salt, (err, passwordHashed)=>{
            if (err){
                throw err;
            }
            pool.query("INSERT INTO users (username, password, firstname, lastname, usergroup) VALUES( ?, ?, ?, ?, ?)", [username, passwordHashed, firstname, lastname, usergroup], (err)=>{
                if (err){
                    console.log("Error adding user to DB: " + err);
                }else{
                    console.log("Successfully added user to DB.");
                }
            });
        })
    });
}


function generateAccessToken(user){
    const token = {
        username: user.username,
        usergroup: user.usergroup,
        expires: Date.now() + 900000
    }
    return jwt.sign(token, process.env.ACCESS_TOKEN_SECRET);
}

function authenticateToken(req, res, next){
   const authHeader = req.headers["authorization"];
   const token = authHeader && authHeader.split(' ')[1];
   if (token == null || typeof token != "string"){
       res.sendStatus(401);
       return;
   }

   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=>{
       if (err){
           res.sendStatus(403);
           return;
       }

       if (Date.now() > user.expires){
            res.sendStatus(403);
            return;
       }

       req.user = user;
       next();
   })
}