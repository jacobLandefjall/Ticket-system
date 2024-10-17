const express = require("express");
const path = require("path");
const multer = require("multer");
const mysql = require("mysql2");
const nodemailer = require('nodemailer');
const emailHandler = require('./src/emailHandler');
const ejs = require('ejs');
require('dotenv').config();
const { authRoutes, checkRole } = require('./src/auth');
const { auth } = require('express-openid-connect');
require('dotenv').config();

const classifyTicket = (description) => {
    if (description.toLowerCase().includes("betalning") || description.toLowerCase().includes("faktura") || description.toLowerCase().includes("finance")) {
        return 1; // Finance category
    } else if (description.toLowerCase().includes("tech support") || description.toLowerCase().includes("support") || description.toLowerCase().includes("teknisk")) {
        return 2; // Tech Support category
    } else {
        return 3; // General Support
    }
};

const app = express();
const port = 1337;

const config = {
    authRequired: true, // True = Login to all routes is a must.
    auth0Logout: true,
    secret: 'a long, randomly-generated string stored in env',
    baseURL: 'http://localhost:1337',
    clientID: 'MnA0j6g3GdrB1JmsUvdFAy8w3a0lbtcX',
    issuerBaseURL: 'https://dev-l8sk27fw0x2ngsvv.us.auth0.com'
  };


// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept any file type
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter, // Attach the file filter
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB size limit
});


// Database connection
const dbConfig = require('./config/db/ticketing_system.json');
const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
    if (err) {
        console.error("Database connection error:", err);
        return;
    }
    console.log("Connected to the database.");
    connection.query(`INSERT IGNORE INTO Categories (name) VALUES 
        ('Software'), 
        ('Settings'), 
        ('More')`, 
        function (error, results) {
        if (error) {
            console.error("Error inserting default categories:", error);
        } else {
            console.log("Default categories ensured.");
        }
    });
});

// Middleware
app.use(auth(config));
app.use(express.static("public"));
app.use(express.static("proj"));
app.use(express.static("uploads")); // Serve uploaded files
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname)));
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// new users automatically get the role of "user"
app.use((req, res, next) => {
    if (req.oidc.isAuthenticated()) {
        const user = req.oidc.user;
        const userRoles = user[`https://ticketsystem.com/roles`] || [];

        // Kontrollera om användaren redan har en roll i Auth0 eller lokalt
        if (userRoles.length === 0) {
            const userId = user.sub;

            // Kolla om användaren redan har en roll i lokala databasen
            const query = 'SELECT role FROM Roles WHERE user_id = ?';
            connection.query(query, [userId], (error, results) => {
                if (error) {
                    console.error("Error checking roles in the database:", error);
                    return next(error);
                }

                // Om användaren redan har en roll i databasen, använd den
                if (results.length > 0) {
                    res.locals.user = {
                        email: user.email,
                        role: results[0].role  // Använd den befintliga rollen från databasen
                    };
                    return next();
                }

                // Om ingen roll finns, tilldela "user" som standardroll
                const insertRoleQuery = 'INSERT INTO Roles (name, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = ?';
                connection.query(insertRoleQuery, [`role_${userId}`, userId, 'user', 'user'], (error) => {
                    if (error) {
                        console.error("Error assigning default role:", error);
                        return next(error);
                    }
                    console.log('Default role "user" assigned successfully');

                    // Efter att rollen tilldelats, sätt res.locals.user
                    res.locals.user = {
                        email: user.email,
                        role: 'user'  // Eftersom vi just har tilldelat 'user'-rollen
                    };
                    next();
                });
            });
        } else {
            // Om användaren redan har en roll i Auth0, använd den
            const role = userRoles.includes('agent') ? 'agent' : 'user';
            res.locals.user = {
                email: user.email,
                role: role  // Tilldela den befintliga rollen från Auth0
            };
            next();
        }
    } else {
        res.locals.user = null;
        next();
    }
});



app.use((req, res, next) => {
    connection.query('SELECT * FROM Categories', (error, categories) => {
        if (error) {
            console.error("Failed to retrieve categories", error);
            return next(error);
        }

        connection.query('SELECT * FROM Teams', (teamError, teams) => {
            if (teamError) {
                console.error("Failed to retrieve teams", teamError);
                return next(teamError);
            }

            res.locals.categories = categories;
            res.locals.teams = teams;
            next();
        });
    });
});

function secured(req, res, next) {
    if (req.oidc.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmailUpdate = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};
const changeUserRole = async (userId, newRole) => {
    const query = 'UPDATE Users SET role = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        connection.query(query, [newRole, userId], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

app.post('/change-role', secured, async (req, res) => {
    const { newRole } = req.body;
    const userId = req.oidc.user.sub;

    // Kontrollera om den nya rollen är giltig
    if (!['user', 'agent'].includes(newRole)) {
        return res.status(400).send('Invalid role specified');
    }

    try {
        // Uppdatera användarens roll i den lokala databasen
        const query = 'UPDATE Roles SET role = ? WHERE user_id = ?';
        connection.query(query, [newRole, userId], (error, results) => {
            if (error) {
                console.error('Failed to update user role:', error);
                return res.status(500).send('Failed to update user role');
            }

            // Uppdatera användarens roll i sessionen och vidarebefordra till en sida
            res.locals.user.role = newRole;  // Uppdatera rollen i sessionen
            console.log(`Role successfully changed to ${newRole}`);
            res.redirect('/proj/home');  // Skicka tillbaka användaren till startsidan efter rollbyte
        });
    } catch (error) {
        console.error('Failed to update user role:', error);
        res.status(500).send('Failed to update user role');
    }
});


app.get('/proj/tickets/manage', secured, checkRole('agent'), (req, res) => {
    res.render('manage_tickets');
});


app.get('/proj/home' , secured, (req, res) => {
    res.render(`home.ejs`);
});

app.use('/auth', authRoutes);

// Route to list knowledge base articles
app.get('/proj/index', (req, res) => {
    connection.query('SELECT * FROM Categories', (error, categories) => {
        if (error) {
            console.error("Error retrieving categories:", error);
            res.status(500).send("Error retrieving categories");
            return;
        }
        connection.query('SELECT * FROM KnowledgeBase', (error, knowledgeBase) => {
            if (error) {
                console.error("Error retrieving knowledge base articles:", error);
                res.status(500).send("Error retrieving knowledge base articles");
                return;
            }
            res.render("index", { categories: categories, knowledgeBase: knowledgeBase });
        });
    });
});

// Route to create a new category
app.post('/proj/category', checkRole('agent'), (req, res) => {
    const categoryName = req.body.name;
    connection.query('INSERT INTO Categories (name) VALUES (?)', [categoryName], function (error) {
        if (error) {
            console.error("Error creating category:", error);
            res.status(500).send("Error creating category");
            return;
        }
        res.redirect('/proj/index');
    });
});

app.get('/proj/tickets', (req, res) => {
    const { description, category, status, team } = req.query;
    let query = `SELECT Tickets.*, Categories.name AS category_name,
                Teams.name AS team_name, Users.email AS user_email,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                    'agent_name', Resolutions.agent_name,
                    'action', Resolutions.action,
                    'comment', Resolutions.comment,
                    'created_at', Resolutions.created_at
                )) FROM Resolutions WHERE Resolutions.ticket_id = Tickets.id) AS resolutions
                FROM Tickets 
                LEFT JOIN Categories ON Tickets.category_id = Categories.id
                JOIN Teams ON Categories.team_id = Teams.id
                LEFT JOIN Users ON Tickets.user_id = Users.id
                WHERE 1=1`;

    const queryParams = [];

    if (description) {
        query += ' AND Tickets.description LIKE ?';
        queryParams.push(`%${description}%`);
    }
    if (category) {
        query += ' AND Categories.name = ?';
        queryParams.push(category);
    }
    if (status) {
        query += ' AND Tickets.status = ?';
        queryParams.push(status);
    }
    if (team) {
        query += ' AND Teams.name = ?';
        queryParams.push(team);
    }

    query += ' ORDER BY Tickets.created_at DESC';

    connection.query(query, queryParams, function (error, tickets) {
        if (error) {
            console.error("Error retrieving tickets:", error);
            res.status(500).send("Error retrieving tickets");
            return;
        }

        connection.query('SELECT * FROM Categories; SELECT * FROM Teams', function (error, results) {
            if (error) {
                console.error("Error retrieving categories and teams:", error);
                res.status(500).send("Error retrieving categories and teams");
                return;
            }

            const categories = results[0];
            const teams = results[1];
            /* console.log(tickets); */
            res.render("tickets.ejs", { tickets, categories, teams });
        });
    });
});


app.post('/proj/ticket/:id/category', checkRole('agent'), (req, res) => {
    const ticketId = req.params.id;
    const categoryId = req.body.category_id;

    // Update the category of the ticket in the database
    connection.query('UPDATE Tickets SET category_id = ? WHERE id = ?', [categoryId, ticketId], (error) => {
        if (error) {
            console.error("Error updating category:", error);
            return res.status(500).send("Error updating category");
        }
        res.redirect('/proj/tickets'); // Redirect back to the tickets page
    });
});


// Route to add resolution for a ticket
app.post('/proj/ticket/:id/resolution', (req, res) => {
    const role = req.oidc.user.role || 'default-role';
    console.log("Role before inserting:", role);
    console.log("Received request for ticket resolution");
    const ticketId = req.params.id;
    const { agent_name, action, comment } = req.body;
    console.log(req.oidc.user); // Check to see if the role is correctly logged
    console.log("Role before inserting:", role);

    const insertResolution = 'INSERT INTO Resolutions (ticket_id, agent_name, action, comment, role) VALUES (?, ?, ?, ?, ?)';
    connection.query(insertResolution, [ticketId, agent_name, action, comment, role], (err, results) => {
        if (err) {
            console.error("Error inserting resolution:", err);
            return res.status(500).send("Failed to insert resolution");
        }
        res.redirect('/proj/tickets');
    });
});

// Route to add a comment to a ticket
app.post('/proj/ticket/:id/comment', secured, checkRole('agent', 'user'), (req, res) => {
    const ticketId = req.params.id;
    const { comment } = req.body;
    
    // Använd res.locals.user för att hämta den aktuella rollen
    const agent_name = req.oidc.user.name;
    const role = res.locals.user.role; // Hämta rollen från sessionen

    console.log(`User ${agent_name} with role ${role} is adding a comment.`);

    if (!comment) {
        return res.status(400).send("Comment is required");
    }

    // Prepare SQL to insert the new comment
    const insertCommentQuery = `
        INSERT INTO Resolutions (ticket_id, agent_name, comment, role, created_at) 
        VALUES (?, ?, ?, ?, NOW());
    `;

    // Execute query to insert the new comment
    connection.query(insertCommentQuery, [ticketId, agent_name, comment, role], (error, results) => {
        if (error) {
            console.error("Error inserting comment:", error);
            return res.status(500).send("Error adding comment");
        }

        res.redirect(`/proj/tickets/history?search=${ticketId}`);
    });
});


// Route to list tickets with filtering and sorting
app.get('/proj/tickets', (req, res) => {
    const userId = req.oidc.user.sub.split('|')[1]; // Extracting user ID
    const { description, category, status } = req.query;
    let query = `SELECT Tickets.*, Categories.name AS category_name, 
                (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                    'agent_name', Resolutions.agent_name,
                    'action', Resolutions.action,
                    'comment', Resolutions.comment,
                    'created_at', Resolutions.created_at
                )) FROM Resolutions WHERE Resolutions.ticket_id = Tickets.id) AS resolutions
                FROM Tickets
                LEFT JOIN Categories ON Tickets.category_id = Categories.id 
                WHERE Tickets.user_id = ?`;  // Ensure only user's tickets are fetched

    const queryParams = [userId];

    if (description) {
        query += ' AND Tickets.description LIKE ?';
        queryParams.push(`%${description}%`);
    }
    if (category) {
        query += ' AND Categories.name = ?';
        queryParams.push(category);
    }
    if (status) {
        query += ' AND Tickets.status = ?';
        queryParams.push(status);
    }

    query += ' ORDER BY Tickets.created_at DESC';

    // Execute the main query to fetch tickets with potential filters applied
    connection.query(query, queryParams, function (error, tickets) {
        if (error) {
            console.error("Error retrieving tickets:", error);
            res.status(500).send("Error retrieving tickets");
            return;
        }

        connection.query('SELECT * FROM Categories; SELECT * FROM Teams', function (error, results) {
            if (error) {
                console.error("Error retrieving categories and teams:", error);
                return res.status(500).send("Error retrieving categories and teams");
            }

            const categories = results[0];
            const teams = results[1];
            res.render("tickets.ejs", { tickets: tickets, categories: categories, teams: teams });
        });
    });
});

// Route to update ticket status
app.post('/proj/ticket/:id/status', (req, res) => {
    const ticketId = req.params.id;
    const newStatus = req.body.status;
    const now = new Date(); // Current time for reference

    connection.query('UPDATE Tickets SET status = ? WHERE id = ?', [newStatus, ticketId], function (error) {
        if (error) {
            console.error("Error updating ticket status:", error);
            return res.status(500).send("Error updating ticket status");
        }

        // Fetch current status to compare if an update is needed
        connection.query('SELECT status FROM Tickets WHERE id = ?', [ticketId], (err, results) => {
            if (err) {
                console.error("Error fetching current status:", err);
                return res.status(500).send("Failed to retrieve current status");
            }

            const currentStatus = results[0].status;
            if (currentStatus !== newStatus) {
                // Only update if there's a change to make
                connection.query('UPDATE Tickets SET status = ?, last_status_change = ? WHERE id = ?', [newStatus, now, ticketId], (updateError) => {
                    if (updateError) {
                        console.error("Error updating ticket status again:", updateError);
                        return res.status(500).send("Error updating ticket status again");
                    }
                    fetchAndRenderTickets(); // Fetch updated ticket data and render
                });
            } else {
                fetchAndRenderTickets(); // Fetch updated ticket data and render
            }
        });
    });

    function fetchAndRenderTickets() {
        const fetchQuery = `SELECT Tickets.*, Categories.name AS category_name, Teams.name AS team_name,
                            (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                'agent_name', Resolutions.agent_name,
                                'action', Resolutions.action,
                                'comment', Resolutions.comment,
                                'created_at', Resolutions.created_at
                            )) FROM Resolutions WHERE Resolutions.ticket_id = Tickets.id) AS resolutions
                            FROM Tickets 
                            LEFT JOIN Categories ON Tickets.category_id = Categories.id
                            LEFT JOIN Teams ON Tickets.team_id = Teams.id
                            ORDER BY Tickets.created_at DESC`;

        connection.query(fetchQuery, function (fetchErr, tickets) {
            if (fetchErr) {
                console.error("Error fetching tickets after status update:", fetchErr);
                return res.status(500).send("Failed to retrieve tickets after update");
            }
            connection.query('SELECT * FROM Categories; SELECT * FROM Teams', function (error, results) {
                if (error) {
                    console.error("Error retrieving categories and teams:", error);
                    return res.status(500).send("Error retrieving categories and teams");
                }
                const categories = results[0];
                const teams = results[1];
                res.render("tickets.ejs", { tickets, categories, teams });
            });
        });
    }
});



app.post('/proj/tickets/:ticketId/mark-seen', (req, res) => {
    const { ticketId } = req.params;
    const { userId } = req.body;
    const query = 'REPLACE INTO TicketViews (user_id, ticket_id, last_seen) VALUES (?, ?, NOW())';
    connection.query(query, [userId, ticketId], (error, results) => {
        if (error) {
            console.error("Error updating ticket view:", error);
            return res.status(500).send("Failed to update ticket view");
        }
        res.send("Ticket view updated");
    });
});

// Route to show ticket details
app.get('/proj/ticket/:id', (req, res) => {
    const ticketId = req.params.id;
    const userId = req.oidc.user.sub;

    // First, update the last seen timestamp
    const updateLastSeen = `
        INSERT INTO TicketViews (user_id, ticket_id, last_seen)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE last_seen = NOW();
    `;
    const ticketQuery = `
        SELECT Tickets.*, Categories.name AS category_name, Teams.name AS team_name,
               GROUP_CONCAT(Attachments.file_path SEPARATOR ',') AS attachments
        FROM Tickets
        LEFT JOIN Categories ON Tickets.category_id = Categories.id
        LEFT JOIN Teams ON Tickets.team_id = Teams.id
        LEFT JOIN Attachments ON Tickets.id = Attachments.ticket_id
        WHERE Tickets.id = ?
        GROUP BY Tickets.id;
    `;

    connection.query(ticketQuery, [ticketId], (error, results) => {
        if (error) {
            console.error("Error fetching ticket details:", error);
            return res.status(500).send('An error occurred while fetching ticket details.');
        }

        if (results.length === 0) {
            return res.status(404).send('Ticket not found');
        }

        const ticketDetails = results[0];
        const attachments = ticketDetails.attachments ? ticketDetails.attachments.split(',') : [];

        res.render('ticketDetails', {
            ticket: ticketDetails,
            attachments: attachments
        });
    });
});

// Route to create a new ticket (limit with 10 files)
app.post('/proj/ticket', secured, checkRole('user', 'agent'), upload.array('attachments', 10), (req, res) => {
    console.log('Files:', req.files); // Logs the uploaded files
    console.log('Body:', req.body); // Logs the form data

    const { title, description, category_id } = req.body;

    // Validate required fields
    if (!title || !description || !category_id) {
        return res.status(400).send("Missing required fields");
    }

    // Check if there are file validation errors
    if (req.fileValidationError) {
        console.error('Validation error:', req.fileValidationError);
        return res.status(400).send(req.fileValidationError);
    }

    const attachmentPaths = req.files.map(file => file.path); // Extract the file paths
    console.log('Attachment Paths:', attachmentPaths);

    const userId = req.oidc.user.sub;
    const extractedUserId = userId.split('|')[1];
    
    // Fetch or create user
    const queryUserId = 'SELECT id FROM Users WHERE google_id = ?';

    connection.query(queryUserId, [extractedUserId], (error, results) => {
        if (error) {
            console.error("Error fetching user ID:", error);
            return res.status(500).send("Error fetching user ID");
        }

        if (results.length === 0) {
            // If the user doesn't exist, create a new user
            const email = req.oidc.user.email;
            const insertUserQuery = 'INSERT INTO Users (email, google_id) VALUES (?, ?)';

            connection.query(insertUserQuery, [email, extractedUserId], (insertError) => {
                if (insertError) {
                    console.error("Error creating user:", insertError);
                    return res.status(500).send("Error creating user");
                }

                // Fetch the new user_id
                connection.query(queryUserId, [extractedUserId], (fetchError, fetchResults) => {
                    if (fetchError) {
                        console.error("Error fetching user ID after creation:", fetchError);
                        return res.status(500).send("Error fetching user ID");
                    }

                    const user_id = fetchResults[0].id;
                    createTicket(title, description, category_id, attachmentPaths, user_id, res);
                });
            });
        } else {
            const user_id = results[0].id;
            createTicket(title, description, category_id, attachmentPaths, user_id, res);
        }
    });
});

// Function to create a ticket and save the attachments
function createTicket(title, description, category_id, attachmentPaths, user_id, res) {
    const query = 'INSERT INTO Tickets (title, description, category_id, user_id) VALUES (?, ?, ?, ?)';
    
    connection.query(query, [title, description, category_id, user_id], (error, results) => {
        if (error) {
            console.error("Error creating ticket:", error);
            return res.status(500).send("Error creating ticket");
        }

        const ticketId = results.insertId;

        // Insert each attachment into the Attachments table
        attachmentPaths.forEach(path => {
            const sql = 'INSERT INTO Attachments (ticket_id, file_path) VALUES (?, ?)';
            connection.query(sql, [ticketId, path], (err, result) => {
                if (err) {
                    console.error("Error saving attachment:", err);
                } else {
                    console.log('Attachment saved:', result.insertId);
                }
            });
        });

        res.redirect('/proj/tickets'); // Redirect after saving the ticket and attachments
    });
}


// Route to show ticket history
app.get('/proj/tickets/history', (req, res) => {
    const { search, description, category, status } = req.query;

    let countQuery = `SELECT status, COUNT(*) as count FROM Tickets GROUP BY status;`;

    // Start building the query to fetch detailed ticket information
    let query = `SELECT Tickets.*, Categories.name AS category_name, Teams.name AS team_name, Users.email AS user_email,
                 (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                     'agent_name', Resolutions.agent_name,
                     'action', Resolutions.action,
                     'comment', Resolutions.comment,
                     'created_at', Resolutions.created_at,
                     'role', Resolutions.role
                 )) FROM Resolutions WHERE Resolutions.ticket_id = Tickets.id) AS resolutions
                 FROM Tickets
                 LEFT JOIN Categories ON Tickets.category_id = Categories.id
                 LEFT JOIN Teams ON Tickets.team_id = Teams.id
                 LEFT JOIN Users ON Tickets.user_id = Users.id
                 WHERE 1=1`;

    let queryParams = [];

    // Dynamic filtering based on input criteria
    if (search) {
        if (!isNaN(parseInt(search))) { // Check if search input is numeric
            query += ' AND Tickets.id = ?';
            queryParams.push(parseInt(search));
        } else { // Search input is not numeric, assume it's a string
            query += ' AND Tickets.title LIKE ?';
            queryParams.push(`%${search}%`);
        }
    }

    if (description) {
        query += ' AND Tickets.description LIKE ?';
        queryParams.push(`%${description}%`);
    }
    if (category) {
        query += ' AND Categories.name = ?';
        queryParams.push(category);
    }
    if (status) {
        query += ' AND Tickets.status = ?';
        queryParams.push(status);
    }

    query += ' ORDER BY Tickets.created_at DESC';

    // Execute the count query first
    connection.query(countQuery, (error, countResults) => {
        if (error) {
            console.error("Error retrieving ticket counts:", error);
            return res.status(500).send("Error retrieving ticket counts");
        }

        const statusCounts = countResults.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
        }, { Open: 0, Closed: 0 });

        // Ensure all status are represented even if not present in the result
        statusCounts.Open = statusCounts.Open || 0;
        statusCounts.Closed = statusCounts.Closed || 0;
        statusCounts.Total = statusCounts.Open + statusCounts.Closed;

        // Now execute the detail query
        connection.query(query, queryParams, function (error, tickets) {
            if (error) {
                console.error("Error retrieving tickets:", error);
                return res.status(500).send("Error retrieving tickets");
            }

            tickets.forEach(ticket => {
                if (ticket.resolutions) {
                    try {
                        ticket.resolutions = JSON.parse(ticket.resolutions);
                    } catch (e) {
                        console.error('Error parsing resolutions:', e);
                    }
                }
            });

            // Fetch categories for dropdowns or filters
            connection.query('SELECT * FROM Categories', function (error, categories) {
                if (error) {
                    console.error("Error retrieving categories:", error);
                    return res.status(500).send("Error retrieving categories");
                }

                // Render the history page with all necessary data
                res.render("history.ejs", {
                    tickets,
                    categories,
                    openTickets: statusCounts.Open,
                    closedTickets: statusCounts.Closed,
                    totalTickets: statusCounts.Total
                });
            });
        });
    });
});

app.get('/logout', (req, res) => {
    res.oidc.logout({
        returnTo: 'http://localhost:1337',
        client_id: process.env.AUTH0_CLIENT_ID,
    });
});

app.get('/login', (req, res) => {
    res.oidc.login({
        returnTo: '/proj/home',
    });
});

app.get('/proj/knowledgebase', (req, res) => {
    connection.query('SELECT * FROM KnowledgeBase', (error, knowledgeBase) => {
        if (error) {
            console.error("Error fetching knowledge base articles:", error);
            return res.status(500).send("Error retrieving knowledge base articles");
        }

        res.render('knowledgebase', {
            knowledgeBase: knowledgeBase,
            user: res.locals.user
        });
    });
});

// Route to show form for creating a new knowledge base article
app.get('/proj/knowledgebase/create', checkRole('agent'), (req, res) => {
    res.render('create_knowledgebase');
});

app.post('/proj/knowledgebase/create', secured, checkRole('agent'), (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).send("Missing required fields");
    }

    const query = 'INSERT INTO KnowledgeBase (title, content) VALUES (?, ?)';
    connection.query(query, [title, content], (error, results) => {
        if (error) {
            console.error("Error creating article:", error);
            return res.status(500).send("Error creating article");
        }
        res.redirect('/proj/knowledgebase');
    });
});

app.post('/proj/knowledgebase/update/:id', checkRole('agent'), (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    connection.query('UPDATE KnowledgeBase SET title = ?, content = ? WHERE id = ?', [title, content, id], (error) => {
        if (error) {
            console.error("Error updating knowledge base article:", error);
            return res.status(500).send("Error updating knowledge base article");
        }
        res.redirect('/proj/knowledgebase');
    });
});

app.post('/proj/knowledgebase/delete/:id', checkRole('agent'), (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM KnowledgeBase WHERE id = ?', [id], (error) => {
        if (error) {
            console.error("Error deleting knowledge base article:", error);
            return res.status(500).send("Error deleting knowledge base article");
        }
        res.redirect('/proj/knowledgebase');
    });
});

// Root route
app.get('/', (req, res) => {
    console.log(req.oidc.isAuthenticated());
    if (req.oidc.isAuthenticated()) {
        res.redirect('/proj/home');
    } else {
        res.redirect('/login');
    }
});

// Listen for port 1337
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});

module.exports = { classifyTicket, app}