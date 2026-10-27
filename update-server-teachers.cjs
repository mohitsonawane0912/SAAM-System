const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add timetable seed
const seedCode = `
    const existingTt = db.prepare('SELECT count(*) as count FROM timetable_entries').get();
    if (existingTt.count === 0) {
      db.prepare("INSERT INTO timetable_entries (id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run('tt1', 'Monday', '09:00', '10:00', 'c1', 's1', 't1', 'cl1');
      db.prepare("INSERT INTO timetable_entries (id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run('tt2', 'Tuesday', '10:00', '11:00', 'c2', 's2', 't2', 'cl2');
    }
`;
code = code.replace(/(\/\/ Insert active lecture sessions)/, seedCode + '\n    $1');

// Add APIs for teachers, creating rooms, creating boards
const newApis = `
app.get('/api/teachers', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers').all();
  const classesTaught = db.prepare(\`
    SELECT DISTINCT te.teacher_id, cl.year, cl.name as class_name 
    FROM timetable_entries te 
    JOIN classes cl ON te.class_id = cl.id
  \`).all();
  
  const result = teachers.map(t => ({
    ...t,
    teaching_years: [...new Set(classesTaught.filter(c => c.teacher_id === t.id).map(c => c.year))],
    teaching_classes: [...new Set(classesTaught.filter(c => c.teacher_id === t.id).map(c => c.class_name))]
  }));
  res.json(result);
});

app.post('/api/classrooms', (req, res) => {
  const { name, capacity } = req.body;
  const id = 'c' + Date.now();
  db.prepare('INSERT INTO classrooms (id, name, status, capacity) VALUES (?, ?, ?, ?)').run(id, name, 'ACTIVE', capacity || 30);
  res.json({ success: true, id });
});

app.post('/api/boards', (req, res) => {
  const { name, classroom_id } = req.body;
  const id = 'b' + Date.now();
  db.prepare('INSERT INTO digital_boards (id, name, classroom_id, status, last_heartbeat, software_version) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, classroom_id, 'OFFLINE', new Date().toISOString(), 'v1.0.0');
  res.json({ success: true, id });
});
`;

code = code.replace(/app\.get\('\/api\/timetable\/config'/g, newApis + "\napp.get('/api/timetable/config'");

fs.writeFileSync('server.ts', code, 'utf8');
