import dotenv from 'dotenv';
dotenv.config();

export const port = process.env.PORT || 5000;
export const jwtSecret = process.env.JWT_SECRET || 'change_me_in_production';
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
