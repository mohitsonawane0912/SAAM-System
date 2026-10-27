const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update express.json limit
code = code.replace(/app\.use\(express\.json\(\)\);/, "app.use(express.json({ limit: '50mb' }));\\napp.use(express.urlencoded({ limit: '50mb', extended: true }));");

// Update the POST /api/students endpoint to remove the pravatar fallback
code = code.replace(
  /image_url \|\| \`https:\/\/i\.pravatar\.cc\/150\?u=\\?\$\{id\}\`/g,
  "image_url"
);

fs.writeFileSync('server.ts', code, 'utf8');
