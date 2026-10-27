const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update students table definition
code = code.replace(
  /CREATE TABLE IF NOT EXISTS students \([\s\S]*?\);/,
  `CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      roll_number TEXT,
      name TEXT,
      class_id TEXT,
      face_enrolled BOOLEAN,
      image_url TEXT,
      FOREIGN KEY(class_id) REFERENCES classes(id)
    );`
);

// Add missing columns if upgrading schema
const alterTable = `
try {
  db.prepare('ALTER TABLE students ADD COLUMN image_url TEXT').run();
} catch (e) {
  // column might already exist
}
`;
code = code.replace(/const db = new Database\('database\.sqlite'\);/, "const db = new Database('database.sqlite');\n" + alterTable);

// Add dummy images to seed
const seedImages = `
    db.prepare("UPDATE students SET image_url = 'https://i.pravatar.cc/150?u=st1' WHERE id = 'st1' AND image_url IS NULL").run();
    db.prepare("UPDATE students SET image_url = 'https://i.pravatar.cc/150?u=st2' WHERE id = 'st2' AND image_url IS NULL").run();
`;
code = code.replace(/if \(existingStudents\.count === 0\) \{[\s\S]*?\}/, `$&
    ${seedImages}
`);

// Update the GET /api/students endpoint
const newGetStudents = `
app.get('/api/students', (req, res) => {
  const students = db.prepare(\`
    SELECT s.*, cl.name as class_name
    FROM students s
    LEFT JOIN classes cl ON s.class_id = cl.id
  \`).all();
  
  // For each student, find their allocated rooms from timetable
  const result = students.map(s => {
    const rooms = db.prepare(\`
      SELECT DISTINCT c.name as room_name
      FROM timetable_entries te
      JOIN classrooms c ON te.classroom_id = c.id
      WHERE te.class_id = ?
    \`).all(s.class_id);
    
    return {
      ...s,
      rooms: rooms.map(r => r.room_name)
    };
  });
  
  res.json(result);
});

app.post('/api/students', (req, res) => {
  const { name, roll_number, class_id, image_url } = req.body;
  const id = 'st_' + Date.now();
  db.prepare('INSERT INTO students (id, name, roll_number, class_id, face_enrolled, image_url) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, name, roll_number, class_id, 1, image_url || \`https://i.pravatar.cc/150?u=\${id}\`
  );
  res.json({ success: true, id });
});

app.get('/api/classes', (req, res) => {
  const classes = db.prepare('SELECT * FROM classes').all();
  res.json(classes);
});
`;

code = code.replace(/app\.get\('\/api\/students', \([\s\S]*?res\.json\(students\);\n\}\);/, newGetStudents);

fs.writeFileSync('server.ts', code, 'utf8');
