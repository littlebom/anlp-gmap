// ===== Auth Types =====
export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'learner' | 'admin' | 'curator';
    createdAt: string;
    updatedAt: string;
}

export interface RegisterDTO {
    name: string;
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: SafeUser;
}

// User without passwordHash (safe to send to client)
export type SafeUser = Omit<User, 'passwordHash'>;

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}
