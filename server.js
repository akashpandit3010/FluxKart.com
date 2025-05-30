require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const app = express();

//configuration
const PORT=process.env.PORT || 3000;
const DB_PATH=process.env.DB_PATH || './contacts.db';

//ensure database file exists
if (!fs.existsSync(DB_PATH)) 
{
  fs.writeFileSync(DB_PATH, '');
}

//database connection
const db=new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => 
{
  if (err) 
  {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log(`Connected to database at ${DB_PATH}`);
});

//initialize database schema
db.serialize(() => 
{
  db.run(`CREATE TABLE IF NOT EXISTS Contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT,
    email TEXT,
    linkedId INTEGER,
    linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL,
    CONSTRAINT unique_contact UNIQUE (email, phoneNumber)
  )`);

  //create indexes
  db.run("CREATE INDEX IF NOT EXISTS idx_email ON Contact(email)");
  db.run("CREATE INDEX IF NOT EXISTS idx_phone ON Contact(phoneNumber)");
  db.run("CREATE INDEX IF NOT EXISTS idx_linked ON Contact(linkedId)");
});

//middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//helper functions
const query = (sql, params) => new Promise((resolve, reject) => 
{
  db.all(sql, params, (err, rows) => 
  {
    if (err) reject(err);
    else resolve(rows);
  });
});

const run = (sql, params) => new Promise((resolve, reject) => 
{
  db.run(sql, params, function(err) 
  {
    if (err) reject(err);
    else resolve(this);
  });
});

//routes
app.get('/', (req, res) => 
{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/identify', async (req, res) => 
{
  try 
  {
    let { email, phoneNumber } = req.body;
    
    //normalize inputs
    email = email?.trim().toLowerCase() || null;
    phoneNumber = phoneNumber?.trim() || null;

    //validation
    if (!email && !phoneNumber) 
    {
      return res.status(400).json({ error: 'At least one of email or phoneNumber is required' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) 
    {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    //find matching contacts
    const matchingContacts = await query(
      `SELECT * FROM Contact 
       WHERE deletedAt IS NULL 
       AND (email = ? OR phoneNumber = ?) 
       ORDER BY createdAt ASC`,
      [email, phoneNumber]
    );

    //case 1: no existing contacts
    if (matchingContacts.length === 0) 
    {
      const { lastID } = await run(
        `INSERT INTO Contact (email, phoneNumber, linkPrecedence) 
         VALUES (?, ?, 'primary')`,
        [email, phoneNumber]
      );

      return res.json({
        contact: {
          primaryContatctId: lastID,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        }
      });
    }

    //find primary contact (oldest)
    let primaryContact = matchingContacts.find(c => c.linkPrecedence === 'primary');
    
    //if no primary in matches, find their primary
    if (!primaryContact) {
      const primaryIds = [...new Set(matchingContacts.map(c => c.linkedId).filter(Boolean))];
      if (primaryIds.length > 0) {
        const [oldestPrimary] = await query(
          `SELECT * FROM Contact 
           WHERE id IN (${primaryIds.map(() => '?').join(',')}) 
           AND linkPrecedence = 'primary' 
           ORDER BY createdAt ASC LIMIT 1`,
          primaryIds
        );
        primaryContact = oldestPrimary;
      }
    }

    //check for new information
    const hasNewEmail = email && !matchingContacts.some(c => c.email === email);
    const hasNewPhone = phoneNumber && !matchingContacts.some(c => c.phoneNumber === phoneNumber);

    //create secondary contact if new info exists
    if (primaryContact && (hasNewEmail || hasNewPhone)) {
      try {
        await run(
          `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence) 
           VALUES (?, ?, ?, 'secondary')`,
          [email, phoneNumber, primaryContact.id]
        );
      } catch (err) {
        if (!err.message.includes('UNIQUE constraint failed')) {
          throw err;
        }
      }
    }

    //find all contacts to merge (including potential separate primary contacts)
    const allContacts = await query(
      `WITH RECURSIVE contact_graph AS (
        SELECT * FROM Contact WHERE id = ?
        UNION
        SELECT c.* FROM Contact c
        JOIN contact_graph cg ON c.linkedId = cg.id OR (c.id = cg.linkedId AND cg.linkPrecedence = 'primary')
        WHERE c.deletedAt IS NULL
      )
      SELECT * FROM contact_graph`,
      [primaryContact.id]
    );

    //find other primary contacts that need to be converted to secondary
    const otherPrimaries = allContacts.filter(
      c => c.linkPrecedence === 'primary' && c.id !== primaryContact.id
    );

    //convert other primaries to secondary
    for (const primary of otherPrimaries) {
      await run(
        `UPDATE Contact 
         SET linkPrecedence = 'secondary', 
             linkedId = ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [primaryContact.id, primary.id]
      );

      //update all their secondaries
      await run(
        `UPDATE Contact 
         SET linkedId = ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE linkedId = ?`,
        [primaryContact.id, primary.id]
      );
    }

    //get final consolidated contacts
    const consolidatedContacts = await query(
      `WITH RECURSIVE contact_tree AS (
        SELECT * FROM Contact WHERE id = ?
        UNION
        SELECT c.* FROM Contact c
        JOIN contact_tree ct ON c.linkedId = ct.id
        WHERE c.deletedAt IS NULL
      )
      SELECT * FROM contact_tree`,
      [primaryContact.id]
    );

    //prepare response
    const emails = [
      ...new Set(
        consolidatedContacts
          .map(c => c.email)
          .filter(Boolean)
          .sort((a, b) => a === primaryContact.email ? -1 : 1)
      )
    ];

    const phoneNumbers = [
      ...new Set(
        consolidatedContacts
          .map(c => c.phoneNumber)
          .filter(Boolean)
          .sort((a, b) => a === primaryContact.phoneNumber ? -1 : 1)
      )
    ];

    const secondaryContacts = consolidatedContacts.filter(
      c => c.linkPrecedence === 'secondary'
    );

    res.json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id)
      }
    });

  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

//error handling middleware
app.use((err, req, res, next)=>{
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

//start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', ()=>{
  db.close();
  process.exit();
});