# Ticket-system
This is my project for the ticket system course.
Project Title: Ticket Management System
Introduction

This project is a Ticket Management System that allows users to create and manage support tickets. Agents can classify and resolve tickets, and both users and agents can comment on ticket updates. The system supports file attachments and integrates with SSO for secure login.
Architecture Overview

The system uses a Node.js backend with MySQL as the database. EJS is used for server-side templating, and Multer handles file uploads. Authentication is done using Auth0 with roles assigned to users and agents.

How to Use
Prerequisites

Before setting up the project, ensure you have the following installed:

    Node.js (version 14 or higher)
    MySQL (version 5.7 or higher)
    Git (for version control)
    Auth0 account (for SSO integration)

You also need to create a .env file with the following keys:

makefile

EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

Install by running:

npm install

Build

No additional build steps are required. Ensure all dependencies are installed with npm install.
Test

To run unit and integration tests, use the following command:

bash

npm test

This will execute the tests in the tests/ directory using Mocha and Chai.
Run

To start the application, run:

sql

npm start

The server will run on http://localhost:1337.

To configure the database, ensure MySQL is running, and update the database configuration in config/db/ticketing_system.json with your local or remote database credentials.

You will also need to set up the database tables using the provided SQL scripts in the project.
License

This project is licensed under the ISC License. See the LICENSE file for more details.