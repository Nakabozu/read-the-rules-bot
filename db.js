const { gT, mT, ansiR } = require("./ansiCodes");

const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database("./bot_data.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log(`${gT}SUCCESS! ${mT}Connected to the SQLite database.${ansiR}`);
  }
});

function initializeDb() {
  // Create a table called 'messages' to store user messages
  db.run(
    `CREATE TABLE IF NOT EXISTS stickies (
    channelId TEXT PRIMARY KEY,
    message TEXT
)`,
    (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
      }
    }
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS onemessage (
    channelId TEXT PRIMARY KEY
)`,
    (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
      }
    }
  );
}

function getAllStickies(callback) {
  let query = `SELECT * FROM stickies`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(`Error retrieving all stickies:`, err.message);
      return;
    }
    if (callback) callback(rows);
  });
}

function getStickyForChannel(channelId, callback) {
  let query = `SELECT * FROM stickies WHERE channelId = ?`;
  db.all(query, [channelId], (err, rows) => {
    if (err) {
      console.error(`Error retrieving sticky for ${channelId}:`, err.message);
      return;
    }
    if (callback) callback(rows);
  });
}

function addSticky(channelId, message) {
  deleteSticky(channelId);
  let query = `INSERT INTO stickies (channelId, message) VALUES (?, ?)`;
  db.run(query, [channelId, message], function (err) {
    if (err) {
      console.error("Error adding this sticky:", err.message);
    } else {
      // console.log(`Sticky added to ${channelId}`);
    }
  });
}

function deleteSticky(channelId) {
  let query = `DELETE FROM stickies WHERE channelId = ?`;

  db.run(query, [channelId], function (err) {
    if (err) {
      console.error("Error deleting row:", err.message);
    } else {
      // console.log(`Row(s) deleted: ${this.changes}`);
    }
  });
}

// Function to retrieve all messages from a specific user in a channel
function getAllNoDupes(callback) {
  let query = `SELECT * FROM onemessage`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(
        `Error retrieving all no-duplicates channels:`,
        err.message
      );
      return;
    }
    if (callback) callback(rows);
  });
}

function getNoDupe(channelId, callback) {
  let query = `SELECT * FROM onemessage WHERE channelId = ?`;
  db.all(query, [channelId], (err, rows) => {
    if (err) {
      console.error(`Error retrieving sticky for ${channelId}:`, err.message);
      return;
    }
    if (callback) callback(rows);
  });
}

function addNoDup(channelId) {
  deleteNoDupe(channelId);
  let query = `INSERT INTO onemessage (channelId) VALUES (?)`;
  db.run(query, [channelId], function (err) {
    if (err) {
      console.error("Error adding this sticky:", err.message);
    } else {
      // console.log(`Sticky added to ${channelId}`);
    }
  });
}

function deleteNoDupe(channelId) {
  let query = `DELETE FROM onemessage WHERE channelId = ?`;
  db.run(query, [channelId], function (err) {
    if (err) {
      console.error("Error deleting row:", err.message);
    } else {
      // console.log(`Row(s) deleted: ${this.changes}`);
    }
  });
}

module.exports = {
  db,
  initializeDb,
  getAllStickies,
  getStickyForChannel,
  addSticky,
  deleteSticky,
  getAllNoDupes,
  getNoDupe,
  addNoDup,
  deleteNoDupe,
};
