import { Router } from 'express';
import { saveUserProfile } from '../controllers/profile.controller';

const router = Router();

// Save or update user profile coming from the mobile Player Profile screen
// This route intentionally does not require authentication because
// the backend uses the Supabase service role key to write to the database,
// and the client identifies users by phone number.
router.post('/', saveUserProfile);

export default router;

