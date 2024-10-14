const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');

// IMAP-konfiguration för att hämta inkommande e-post
const imapConfig = {
    imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};

// SMTP-konfiguration för att skicka e-postuppdateringar
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Använd samma miljövariabler för konsekvens
        pass: process.env.EMAIL_PASS
    }
});

// Databaskonfiguration (antag att du har en JSON-fil med rätt inställningar)
const dbConfig = require('../config/db/ticketing_system.json');
const connection = mysql.createConnection(dbConfig);

// Koppla upp mot databasen
connection.connect(err => {
    if (err) {
        console.error("Database connection error:", err);
        return;
    }
    console.log("Connected to the database.");
});

// Skicka biljettuppdateringar via e-post
const sendEmailUpdate = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,  // Avsändarens e-postadress
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

// Funktion för att klassificera biljetter (använder din existerande logik)
const classifyTicket = (description) => {
    // Placeholder för klassificering
    if (description.includes('error')) {
        return 1; // Anta att 1 motsvarar en viss kategori i databasen
    } else if (description.includes('support')) {
        return 2;
    }
    return 3; // Default kategori
};

// Funktion för att skapa biljett från inkommande e-post
const createTicketFromEmail = (email) => {
    const description = email.text;  // E-postens innehåll blir biljetten
    const userEmail = email.from.value[0].address;  // Avsändarens e-postadress

    // Automatiskt klassificera biljetten (från din classifyTicket-funktion)
    const category = classifyTicket(description);

    const query = 'INSERT INTO Tickets (description, category_id, user_email) VALUES (?, ?, ?)';
    connection.query(query, [description, category, userEmail], (error, results) => {
        if (error) {
            console.error("Error creating ticket:", error);
        } else {
            console.log("Ticket created from email:", results.insertId);
        }
    });
};

// Hämta olästa e-postmeddelanden och skapa biljetter
const fetchEmails = () => {
    imaps.connect(imapConfig).then(connection => {
        return connection.openBox('INBOX').then(() => {
            const searchCriteria = ['UNSEEN'];  // Hämta endast olästa e-postmeddelanden
            const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

            return connection.search(searchCriteria, fetchOptions).then(messages => {
                messages.forEach(item => {
                    const all = item.parts.find(part => part.which === 'TEXT');
                    const idHeader = "Imap-Id: " + item.attributes.uid + "\r\n";

                    // Parse the email content using mailparser
                    simpleParser(idHeader + all.body, (err, mail) => {
                        if (err) {
                            console.error("Error parsing email:", err);
                            return;
                        }

                        // Skapa biljett baserat på e-posten
                        createTicketFromEmail(mail);
                    });
                });
            });
        });
    }).catch(err => {
        console.error("Error connecting to IMAP server:", err);
    });
};

// Stäng databasanslutningen när processen avslutas
const closeConnection = () => {
    connection.end(err => {
        if (err) {
            console.error("Error closing database connection:", err);
        } else {
            console.log("Database connection closed.");
        }
    });
};

// Exportera funktioner för att kunna användas i index.js
module.exports = {
    fetchEmails,
    sendEmailUpdate,
    closeConnection
};
