import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import runCarryForwardJob from './cron/carryForwardJob';
import seedUsers from './seeds/userSeeder';
import seedLeaveTypes from './seeds/leaveTypeSeeder';
import authRoutes from './routes/authRoutes';
import leaveRoutes from './routes/leaveRoutes';
import { initializeDatabase } from './config/db';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/leave', leaveRoutes);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

initializeDatabase()
  .then(async () => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    await seedLeaveTypes();
    await seedUsers();
    runCarryForwardJob();
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
