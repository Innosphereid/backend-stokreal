import knex from 'knex';
import config from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

if (!knexConfig) {
  throw new Error(`No database configuration found for environment: ${environment}`);
}

export const db = knex(knexConfig);

export const connectDatabase = async (): Promise<void> => {
  try {
    await db.raw('SELECT 1+1 as result');
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};

export default db;
