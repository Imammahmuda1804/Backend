const http = require('http');

function check(path) {
  http.get(`http://localhost:3000${path}`, (res) => {
    console.log(`Path: ${path} -> Status: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`Error for ${path}: ${e.message}`);
  });
}

check('/uploads/destinations/1778389481373-73074069.webp');
check('/api/uploads/destinations/1778389481373-73074069.webp');
