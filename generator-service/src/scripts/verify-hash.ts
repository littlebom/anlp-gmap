
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
const user = users.find((u: any) => u.email === 'test@example.com');

if (!user) {
    console.error('User not found!');
    process.exit(1);
}

const password = 'password123';
bcrypt.compare(password, user.passwordHash).then(isValid => {
    console.log(`Password valid: ${isValid}`);
    console.log(`Hash in file: ${user.passwordHash}`);
});
