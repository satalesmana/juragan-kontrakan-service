import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  
  const db = client.db('rental_management');
  const user = await db.collection('users').findOne({ email: 'admin@example.com' });
  
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  console.log(JSON.stringify({ accessToken: token }));
  
  await client.close();
}

main().catch(console.error);
