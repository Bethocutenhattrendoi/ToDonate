import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGOOSEDB_CONNECT_STRING;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in env');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ username: 'testuser_e2e' });
  if (!user) {
    user = await User.create({
      username: 'testuser_e2e',
      displayName: 'Test User',
      email: 'testuser@example.com',
      avatarUrl: '',
      dPointAvailable: 1000,
    });
    console.log('Created test user:', user._id.toString());
  } else {
    console.log('Test user exists:', user._id.toString());
  }

  const token = jwt.sign({ uid: user._id }, JWT_SECRET, { expiresIn: '7d' });
  console.log('JWT (for Authorization header):');
  console.log(token);
  console.log('\nCookie header value (use as: Cookie: access_token=<token>):');
  console.log(`access_token=${token}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
