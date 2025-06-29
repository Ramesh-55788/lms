import 'dotenv/config';
import Queue from 'bull';
import { AppDataSource } from '../config/db';
import { createUser } from '../repositories/UserRepository';

interface UserJobData {
  users: {
    name: string;
    email: string;
    password: string;
    role: string;
    manager_id?: number | null;
  }[];
}

const userQueue = new Queue<UserJobData>('userQueue', {
  redis: { port: 6380, host: '127.0.0.1' }
});

(async () => {
  try {
    await AppDataSource.initialize();
    console.log('Worker DB Connected');

    userQueue.process(async (job, done) => {
      const { users } = job.data;
      try {
        for (const user of users) {
          const { name, email, password, role, manager_id } = user;
          // await createUser(name, email, password, role, manager_id || null);
        }
        console.log(`Processed chunk of ${users.length} users`);
        done();
      } catch (err) {
        console.error('Job failed:', err);
        done(err as Error);
      }
    });

    userQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
    });

  } catch (err) {
    console.error('Worker setup failed:', err);
    process.exit(1);
  }
})();
