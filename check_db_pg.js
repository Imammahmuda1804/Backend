const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/wisata_db'
});

async function run() {
  try {
    await client.connect();
    
    console.log("=== LATEST DESTINATIONS ===");
    const resDest = await client.query('SELECT id, name, thumbnail_url FROM destinations ORDER BY id DESC LIMIT 5');
    console.table(resDest.rows);

    console.log("\n=== LATEST IMAGES ===");
    const resImg = await client.query('SELECT id, destination_id, image_url FROM destination_images ORDER BY id DESC LIMIT 5');
    console.table(resImg.rows);
    
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

run();
