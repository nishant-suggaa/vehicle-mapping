import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgres://abhinav-suggaa:LK46ECPdfqRM@ep-old-mountain-812983.us-east-2.aws.neon.tech/neondb',
  ssl: {
    rejectUnauthorized: false
  }
});

export default client;
