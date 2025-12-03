import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

export default router;

