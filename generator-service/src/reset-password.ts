
import { userStore } from './modules/auth/auth.store';
import bcrypt from 'bcryptjs';
import { logger } from './utils/logger';

async function reset() {
    const email = 'test@example.com';
    const newPass = 'password123';

    const user = userStore.findByEmail(email);
    if (user) {
        const hash = await bcrypt.hash(newPass, 10);
        user.passwordHash = hash;
        // Trigger save (hacky as store doesn't expose update, but modify ref + create calls save)
        // Actually store.create pushes to array. We need to update in place and call save.
        // Let's use internal method if possible or re-instantiate store? 
        // userStore has private save. But it exports instance.
        // Let's just write to file directly if needed, but userStore.users is private.
        // Wait, userStore.users is private.

        // Let's use a workaround:
        // 1. Read file
        // 2. Update json
        // 3. Write file

        const fs = require('fs');
        const path = require('path');
        const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        const target = users.find((u: any) => u.email === email);
        if (target) {
            target.passwordHash = hash;
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            console.log(`Password for ${email} reset to ${newPass}`);
        } else {
            console.log('User not found in file');
        }
    } else {
        // Create user
        const hash = await bcrypt.hash(newPass, 10);
        const newUser = {
            id: 'test-user-id',
            name: 'Test User',
            email,
            passwordHash: hash,
            role: 'learner',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        userStore.create(newUser);
        console.log(`Created user ${email} with password ${newPass}`);
    }
}

reset();
