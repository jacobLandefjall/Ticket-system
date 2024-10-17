-- 1. Create the Users table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('user', 'agent') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    google_id VARCHAR(255)
);

-- 2. Create the Teams table
CREATE TABLE Teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Insert default Teams
INSERT INTO Teams (name) VALUES 
('Finance Team'), 
('Tech Support Team'), 
('General Support');

-- 3. Create UserTeams table for many-to-many relation between users and teams
CREATE TABLE UserTeams (
    user_id INT,
    team_id INT,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE
);

-- Insert an example relation: agent to Tech Support Team
INSERT INTO UserTeams (user_id, team_id) VALUES (1, 2);

-- 4. Create the Roles table
CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

ALTER TABLE Roles ADD COLUMN user_id VARCHAR(255);
ALTER TABLE Roles ADD role VARCHAR(255);
ALTER TABLE Roles DROP INDEX name;


-- Insert default roles
INSERT INTO Roles (name) VALUES ('user'), ('agent');

-- 5. Create the UserRoles table for many-to-many relation between users and roles
CREATE TABLE UserRoles (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (role_id) REFERENCES Roles(id)
);

-- 6. Create the Categories table
CREATE TABLE Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    team_id INT,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE SET NULL
);

-- Insert default categories and associate with teams
INSERT INTO Categories (name, team_id) VALUES 
('Software', 2),  -- Tech Support Team
('Settings', 3),  -- General Support Team
('Wi-Fi', 2),     -- Tech Support Team
('More', 1);      -- Finance Team

-- 7. Create the Tickets table
CREATE TABLE Tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    user_id INT,
    category_id INT,
    attachments TEXT,
    status ENUM('Open', 'Closed') DEFAULT 'Open',
    team_id INT,
    user_email VARCHAR(255),
    last_status_change TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE SET NULL
);

-- Update team_id in Tickets based on related category
UPDATE Tickets t
JOIN Categories c ON t.category_id = c.id
SET t.team_id = c.team_id
WHERE t.team_id IS NULL;

-- 8. Create the Attachments table
CREATE TABLE Attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    file_path VARCHAR(255) NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id) ON DELETE CASCADE
);

-- 9. Create the Comments table
CREATE TABLE Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    agent_name VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id)
);

-- 10. Create the Resolutions table with a check constraint on the 'role' column
CREATE TABLE Resolutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    agent_name VARCHAR(255),
    action TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(255),
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id) ON DELETE CASCADE,
    CONSTRAINT chk_role CHECK (role IN ('agent', 'user'))
);

-- 11. Create the KnowledgeBase table
CREATE TABLE KnowledgeBase (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12. Create the TicketViews table to track user interactions with tickets
CREATE TABLE TicketViews (
    user_id INT,
    ticket_id INT,
    last_seen TIMESTAMP,
    PRIMARY KEY (user_id, ticket_id),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id)
);

-- 13. Create the TicketStatusHistory table to track status changes of tickets
CREATE TABLE TicketStatusHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id)
);
