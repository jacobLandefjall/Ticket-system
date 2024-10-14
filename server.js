const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Save file with unique name
    }
});
const upload = multer({ storage: storage });

// Setup MySQL connection
const pool = mysql.createPool({
    host: 'localhost',
    database: 'sqltest',
    user: 'sqltest',
    password: 'mysecret1',
    connectionLimit: 10,
});

// Route for creating a ticket
app.post('/tickets', (req, res) => {
    const { description } = req.body;

    if (!description) {
        return res.status(400).send('Description is required');
    }

    const query = 'INSERT INTO tickets (description) VALUES (?)';
    pool.query(query, [description], (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error creating ticket');
        }

        res.send({ message: 'Ticket created successfully', ticketId: result.insertId });
    });
});

// Route for uploading attachments to a ticket
app.post('/tickets/:ticketId/attachments', upload.single('file'), (req, res) => {
    const { ticketId } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).send('File is required');
    }

    const query = 'INSERT INTO attachments (ticket_id, filename, file_path) VALUES (?, ?, ?)';
    const filePath = `uploads/${file.filename}`;

    pool.query(query, [ticketId, file.originalname, filePath], (error, result) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error uploading file');
        }

        res.send({ message: 'File uploaded successfully', attachmentId: result.insertId });
    });
});

// Route for fetching tickets
app.get('/tickets', (req, res) => {
    pool.query('SELECT * FROM tickets', (error, results) => {
        console.log('Query: SELECT * FROM tickets');
        if (error) {
            console.error(error);
            return res.status(500).send('Error fetching tickets');
        }

        res.send(results);
    });
});

// Route for fetching attachments for a ticket
app.get('/tickets/:ticketId/attachments', (req, res) => {
    const { ticketId } = req.params;

    pool.query('SELECT * FROM attachments WHERE ticket_id = ?', [ticketId], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error fetching attachments');
        }

        res.send(results);
    });
});

app.get('/check-db', (req, res) => {
    pool.query('SHOW TABLES', (error, results) => {
        if (error) {
            console.error('Error fetching tables:', error);
            return res.status(500).send('Database error');
        }

        // Log all the fetched tables
        console.log('Fetched tables:', results);

        // Bygg en HTML-struktur för att visa tabellerna
        let html = '<h1>Tabeller i sqltest</h1><table border="1"><tr><th>Table Name</th></tr>';
        results.forEach(row => {
            // Det kan vara värt att logga ut varje rad för att undersöka vad som skickas
            console.log('Row:', row);
            html += `<tr><td>${row.Tables_in_sqltest}</td></tr>`;
        });
        html += '</table>';

        // Skicka HTML till klienten
        res.send(html);
    });
});


app.get('/check-tickets', (req, res) => {
    pool.query('SHOW TABLES LIKE "tickets"', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error checking tickets table');
        }

        if (results.length > 0) {
            res.send('Tickets table exists');
        } else {
            res.send('Tickets table does not exist');
        }
    });
});

app.get('/current-db', (req, res) => {
    pool.query('SELECT DATABASE()', (error, results) => {
        if (error) {
            return res.status(500).send('Error fetching current database');
        }
        res.send(`Current database: ${results[0]['DATABASE()']}`);
    });
});




// Start the server
app.listen(3500, () => {
    console.log('Server is running on port 3500');
});
