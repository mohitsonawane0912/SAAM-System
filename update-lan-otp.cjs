const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
app.post('/api/boards/pair', (req, res) => {
  const { room_name, otp } = req.body;
  if (!otp || otp.length < 4) {
    return res.status(400).json({ error: 'Invalid LAN OTP' });
  }
  
  // Create a unified Classroom + Board pairing using OTP over LAN logic
  const classId = 'c_' + Date.now();
  const boardId = 'b_' + Date.now();
  
  // Register the fixed room (e.g. Room 101)
  db.prepare('INSERT INTO classrooms (id, name, status, capacity) VALUES (?, ?, ?, ?)').run(classId, room_name, 'ACTIVE', 30);
  // Bind the digital board permanently to the classroom
  db.prepare('INSERT INTO digital_boards (id, name, classroom_id, status, last_heartbeat, software_version) VALUES (?, ?, ?, ?, ?, ?)').run(boardId, room_name + ' Digital Board', classId, 'CONNECTED', new Date().toISOString(), 'v2.0-LAN-Sync');
  
  res.json({ success: true, classroom_id: classId, board_id: boardId });
});

app.post('/api/teachers', (req, res) => {
  const { name, department, employee_id } = req.body;
  const id = 't_' + Date.now();
  db.prepare('INSERT INTO teachers (id, name, department, employee_id) VALUES (?, ?, ?, ?)').run(id, name, department, employee_id);
  res.json({ success: true, id });
});
`;

code = code.replace(/app\.get\('\/api\/timetable\/config'/g, newRoutes + "\napp.get('/api/timetable/config'");
fs.writeFileSync('server.ts', code, 'utf8');
