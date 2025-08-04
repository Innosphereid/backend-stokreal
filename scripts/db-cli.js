#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Get command line arguments
const args = process.argv.slice(2);

// Function to show help
function showHelp() {
  console.log('🗄️  Database CLI Tool');
  console.log('===================');
  console.log('');
  console.log('Usage:');
  console.log('  npm run db migrate:make    Create a new migration file');
  console.log('  npm run db seeder:make     Create a new seeder file');
  console.log('');
  console.log('Examples:');
  console.log('  npm run db migrate:make');
  console.log('  npm run db seeder:make');
  console.log('');
}

// Function to format date as YYYYMMDDHHMMSS
function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Function to convert filename to snake_case
function toSnakeCase(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

// Migration template
function getMigrationTemplate(tableName) {
  return `import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('${tableName}', table => {
    table.increments('id').primary();
    
    // Add your columns here
    // table.string('name').notNullable();
    // table.text('description').nullable();
    // table.boolean('is_active').defaultTo(true);
    
    table.timestamps(true, true);

    // Add indexes here
    // table.index(['name']);
    // table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('${tableName}');
}
`;
}

// Seeder template
function getSeederTemplate(tableName) {
  return `import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('${tableName}').del();

  // Inserts seed entries
  await knex('${tableName}').insert([
    {
      // Add your seed data here
      // name: 'Sample Name 1',
      // description: 'Sample description 1',
      // is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: new Date(),
    },
    {
      // Add your seed data here
      // name: 'Sample Name 2',
      // description: 'Sample description 2',
      // is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: new Date(),
    },
    {
      // Add your seed data here
      // name: 'Sample Name 3',
      // description: 'Sample description 3',
      // is_active: false,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: new Date(),
    },
  ]);
}
`;
}

// Function to create migration file
function createMigrationFile(fileName) {
  const timestamp = formatTimestamp();
  const snakeCaseFileName = toSnakeCase(fileName);
  const migrationFileName = `${timestamp}_${snakeCaseFileName}.ts`;
  const migrationsDir = path.join(process.cwd(), 'src', 'database', 'migrations');
  const filePath = path.join(migrationsDir, migrationFileName);

  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  // Extract table name from filename (assume it's create_table_name format)
  let tableName = snakeCaseFileName;
  if (snakeCaseFileName.startsWith('create_')) {
    tableName = snakeCaseFileName.replace('create_', '').replace('_table', '');
  }

  // Generate migration content
  const migrationContent = getMigrationTemplate(tableName);

  // Write the file
  try {
    fs.writeFileSync(filePath, migrationContent);
    console.log(`\n✅ Migration file created successfully!`);
    console.log(`📁 File: ${migrationFileName}`);
    console.log(`📍 Location: ${filePath}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Edit the migration file to add your table structure`);
    console.log(`   2. Run: npm run migrate:latest`);
    console.log(`   3. To rollback: npm run migrate:rollback`);
  } catch (error) {
    console.error(`❌ Error creating migration file: ${error.message}`);
    process.exit(1);
  }
}

// Function to create seeder file
function createSeederFile(fileName) {
  const timestamp = formatTimestamp();
  const snakeCaseFileName = toSnakeCase(fileName);
  const seederFileName = `${timestamp}_${snakeCaseFileName}.ts`;
  const seedsDir = path.join(process.cwd(), 'src', 'database', 'seeds');
  const filePath = path.join(seedsDir, seederFileName);

  // Ensure seeds directory exists
  if (!fs.existsSync(seedsDir)) {
    fs.mkdirSync(seedsDir, { recursive: true });
  }

  // Extract table name from filename
  let tableName = snakeCaseFileName;
  
  // Remove common seeder suffixes/prefixes
  if (snakeCaseFileName.startsWith('seed_')) {
    tableName = snakeCaseFileName.replace('seed_', '');
  }
  if (snakeCaseFileName.endsWith('_seeder')) {
    tableName = snakeCaseFileName.replace('_seeder', '');
  }
  if (snakeCaseFileName.endsWith('_data')) {
    tableName = snakeCaseFileName.replace('_data', '');
  }
  
  // If it's still the same, try to extract meaningful table name
  if (tableName === snakeCaseFileName) {
    // For names like "products data" -> "products"
    tableName = tableName.split('_')[0];
  }

  // Generate seeder content
  const seederContent = getSeederTemplate(tableName);

  // Write the file
  try {
    fs.writeFileSync(filePath, seederContent);
    console.log(`\n✅ Seeder file created successfully!`);
    console.log(`📁 File: ${seederFileName}`);
    console.log(`📍 Location: ${filePath}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Edit the seeder file to add your seed data`);
    console.log(`   2. Run: npm run seed:run`);
    console.log(`   3. To create more seeders: npm run db seeder:make`);
  } catch (error) {
    console.error(`❌ Error creating seeder file: ${error.message}`);
    process.exit(1);
  }
}

// Function to handle migrate:make command
function handleMigrateMake() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🚀 Create New Migration');
  console.log('========================');
  console.log('');
  
  rl.question('📝 Enter migration name (e.g., "create users table"): ', (fileName) => {
    if (!fileName || fileName.trim() === '') {
      console.log('❌ Migration name cannot be empty!');
      rl.close();
      process.exit(1);
    }

    console.log(`\n📋 Creating migration: ${fileName}`);
    console.log(`🕒 Timestamp: ${formatTimestamp()}`);
    console.log(`🔄 Processing...`);

    createMigrationFile(fileName);
    rl.close();
  });

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    console.log('\n\n👋 Migration creation cancelled.');
    process.exit(0);
  });
}

// Function to handle seeder:make command
function handleSeederMake() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🌱 Create New Seeder');
  console.log('====================');
  console.log('');
  
  rl.question('📝 Enter seeder name (e.g., "users data" or "products seeder"): ', (fileName) => {
    if (!fileName || fileName.trim() === '') {
      console.log('❌ Seeder name cannot be empty!');
      rl.close();
      process.exit(1);
    }

    console.log(`\n📋 Creating seeder: ${fileName}`);
    console.log(`🕒 Timestamp: ${formatTimestamp()}`);
    console.log(`🔄 Processing...`);

    createSeederFile(fileName);
    rl.close();
  });

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    console.log('\n\n👋 Seeder creation cancelled.');
    process.exit(0);
  });
}

// Main function
function main() {
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'migrate:make':
      handleMigrateMake();
      break;
    
    case 'seeder:make':
      handleSeederMake();
      break;
    
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('');
      showHelp();
      process.exit(1);
  }
}

// Run the script
main();