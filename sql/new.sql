CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('user', 'agent') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    google_id VARCHAR(255)
);

CREATE TABLE Teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

INSERT INTO Teams (name) VALUES 
('Finance Team'), 
('Tech Support Team'), 
('General Support');

CREATE TABLE IF NOT EXISTS UserTeams (
    user_id INT,
    team_id INT,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE CASCADE
);
-- Example: agent to Tech Support Team
INSERT INTO UserTeams (user_id, team_id) VALUES (1, 2);


CREATE TABLE IF NOT EXISTS Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    agent_name VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id)
);


CREATE TABLE Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    team_id INT,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE SET NULL
);

INSERT INTO Categories (name, team_id) VALUES 
('Software', 2),  -- Tech Support Team
('Settings', 3),  -- General Support Team
('Wi-Fi', 2),     -- Tech Support Team
('More', 1)       -- Finance Team
ON DUPLICATE KEY UPDATE name = name;

UPDATE Categories SET team_id = 2 WHERE name = 'Software';   -- Tech Support Team
UPDATE Categories SET team_id = 3 WHERE name = 'Settings';   -- General Support Team
UPDATE Categories SET team_id = 2 WHERE name = 'Wi-Fi';      -- Tech Support Team
UPDATE Categories SET team_id = 1 WHERE name = 'More';       -- Finance Team


ALTER TABLE Categories ADD COLUMN team_id INT;

-- Add a foreign key constraint to link to the Teams table
ALTER TABLE Categories ADD CONSTRAINT fk_team_id FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE SET NULL;


-- Skapa tabellen för biljetter
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
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES Teams(id) ON DELETE SET NULL
);
/*  log the last status change date */
ALTER TABLE Tickets ADD COLUMN last_status_change TIMESTAMP NULL DEFAULT NULL;

UPDATE Tickets SET attachments = JSON_ARRAY_APPEND(attachments, '$', 'ny_fil_sökväg') WHERE id = 'biljett_id';


CREATE TABLE Attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    file_path VARCHAR(255) NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id) ON DELETE CASCADE
);

CREATE TABLE Resolutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT,
    agent_name VARCHAR(255),
    action TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id) ON DELETE CASCADE
);

ALTER TABLE Resolutions
ADD COLUMN role VARCHAR(255);

ALTER TABLE Resolutions ADD CONSTRAINT chk_role CHECK (role IN ('agent', 'user'));


CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO Roles (name) VALUES ('user'), ('agent');

CREATE TABLE UserRoles (
    user_id INT,
    role_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (role_id) REFERENCES Roles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE KnowledgeBase (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

/*  table to track user interactions with tickets */
CREATE TABLE TicketViews (
    user_id INT,
    ticket_id INT,
    last_seen TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id),
    PRIMARY KEY (user_id, ticket_id)
);

CREATE TABLE TicketStatusHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id)
);
