CREATE database skill_exchange;
use skill_exchange;

CREATE TABLE User (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Email VARCHAR(100) UNIQUE,
    Phone VARCHAR(15),
    Location VARCHAR(100),
    Bio TEXT,
    DateJoining DATE
);

CREATE TABLE Skill (
    SkillId INT AUTO_INCREMENT PRIMARY KEY,
    SkillName VARCHAR(100),
    Description TEXT,
    Category VARCHAR(100),
    UserId INT,
    FOREIGN KEY (UserId) REFERENCES User(UserId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE Request (
    RequestId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT,
    SkillId INT,
    TimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(50),
    FOREIGN KEY (UserId) REFERENCES User(UserId)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (SkillId) REFERENCES Skill(SkillId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE Transaction (
    TransactionId INT AUTO_INCREMENT PRIMARY KEY,
    RequestId INT,
    CompletionDate DATE,
    Status VARCHAR(50),
    FOREIGN KEY (RequestId) REFERENCES Request(RequestId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE Review (
    ReviewId INT AUTO_INCREMENT PRIMARY KEY,
    TransactionId INT,
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    Comments TEXT,
    FOREIGN KEY (TransactionId) REFERENCES Transaction(TransactionId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

ALTER TABLE User ADD Password VARCHAR(255);
select * from user;

SELECT s.SkillId, s.SkillName, s.Description, s.Category, s.UserId, u.Name AS userName
FROM Skill s
JOIN User u ON s.UserId = u.UserId;
select * from Skill;
SHOW COLUMNS FROM User;

select * from user;
select * from skill;
select * from request;
select * from transaction;
select * from review;

-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;
-- Delete from child tables first (if cascading doesn't cover everything)
DELETE FROM Review;
DELETE FROM Transaction;
DELETE FROM Request;
DELETE FROM Skill;
DELETE FROM User;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;