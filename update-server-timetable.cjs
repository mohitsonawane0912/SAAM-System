const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace standard tables with timetable added
const newTables = `
    CREATE TABLE IF NOT EXISTS timetable_config (
      id TEXT PRIMARY KEY,
      days TEXT,
      start_time TEXT,
      end_time TEXT,
      slot_duration INTEGER
    );
    CREATE TABLE IF NOT EXISTS timetable_entries (
      id TEXT PRIMARY KEY,
      day_of_week TEXT,
      start_time TEXT,
      end_time TEXT,
      classroom_id TEXT,
      subject_id TEXT,
      teacher_id TEXT,
      class_id TEXT,
      FOREIGN KEY(classroom_id) REFERENCES classrooms(id)
    );
`;

code = code.replace(/CREATE TABLE IF NOT EXISTS classrooms/, newTables + 'CREATE TABLE IF NOT EXISTS classrooms');

// Add routes
const routes = `
app.get('/api/timetable/config', (req, res) => {
  const config = db.prepare('SELECT * FROM timetable_config LIMIT 1').get() || {
    days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
    start_time: '09:00',
    end_time: '16:00',
    slot_duration: 60
  };
  res.json({ ...config, days: typeof config.days === 'string' ? JSON.parse(config.days) : config.days });
});

app.post('/api/timetable/config', (req, res) => {
  const { days, start_time, end_time, slot_duration } = req.body;
  const existing = db.prepare('SELECT id FROM timetable_config LIMIT 1').get();
  if (existing) {
    db.prepare('UPDATE timetable_config SET days = ?, start_time = ?, end_time = ?, slot_duration = ? WHERE id = ?')
      .run(JSON.stringify(days), start_time, end_time, slot_duration, existing.id);
  } else {
    db.prepare('INSERT INTO timetable_config (id, days, start_time, end_time, slot_duration) VALUES (?, ?, ?, ?, ?)')
      .run('cfg1', JSON.stringify(days), start_time, end_time, slot_duration);
  }
  res.json({ success: true });
});

app.get('/api/timetable', (req, res) => {
  const entries = db.prepare(\`
    SELECT te.*, c.name as classroom_name, s.name as subject_name, t.name as teacher_name, cl.name as class_name
    FROM timetable_entries te
    LEFT JOIN classrooms c ON te.classroom_id = c.id
    LEFT JOIN subjects s ON te.subject_id = s.id
    LEFT JOIN teachers t ON te.teacher_id = t.id
    LEFT JOIN classes cl ON te.class_id = cl.id
  \`).all();
  res.json(entries);
});

app.post('/api/timetable', (req, res) => {
  const { id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id } = req.body;
  db.prepare('INSERT OR REPLACE INTO timetable_entries (id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id);
  res.json({ success: true });
});

app.delete('/api/timetable/:id', (req, res) => {
  db.prepare('DELETE FROM timetable_entries WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/reports/detailed', (req, res) => {
  const activeSessions = db.prepare("SELECT * FROM lecture_sessions").all();
  const roomReports = [];
  for (const session of activeSessions) {
    const classroom = db.prepare("SELECT * FROM classrooms WHERE id = ?").get(session.classroom_id);
    const records = db.prepare(\`
      SELECT s.name as student_name, ar.status as attendance_status, 
             (SELECT count(*) FROM attendance_records past_ar WHERE past_ar.student_id = s.id AND past_ar.status = 'PRESENT') as total_presents
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = ?
    \`).all(session.id);
    
    roomReports.push({
      room_name: classroom.name,
      records: records.map(r => ({
        student_name: r.student_name,
        status: r.attendance_status === 'PRESENT' ? 'Present' : 'Absent',
        previous_record: \`\${r.total_presents} Presents\`
      }))
    });
  }
  res.json(roomReports);
});

// Remove old AI route
`;

code = code.replace(/\/\/ AI Analytics Route using Gemini[\s\S]*?\/\/ Demo mode trigger/, routes + '\n\n// Demo mode trigger');

code = code.replace(/import \{ GoogleGenAI.*?\} from '@google\/genai';\n/, '');

fs.writeFileSync('server.ts', code, 'utf8');
