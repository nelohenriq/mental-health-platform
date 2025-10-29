import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Test User
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'USER',
      privacyMode: 'STANDARD',
      onboardingCompleted: true,
    },
  });

  // Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      privacyMode: 'STANDARD',
      onboardingCompleted: true,
    },
  });

  // Therapist User
  const therapistUser = await prisma.user.upsert({
    where: { email: 'therapist@example.com' },
    update: {},
    create: {
      email: 'therapist@example.com',
      name: 'Dr. Sarah Johnson',
      password: hashedPassword,
      role: 'THERAPIST',
      privacyMode: 'STANDARD',
      onboardingCompleted: true,
    },
  });

  console.log('Created test users:', {
    testUser: testUser.email,
    adminUser: adminUser.email,
    therapistUser: therapistUser.email,
  });

  // Create sample mood entries for test user
  const moodEntries = await Promise.all([
    prisma.moodEntry.create({
      data: {
        userId: testUser.id,
        moodLevel: 7,
        notes: 'Feeling good today, had a productive morning',
        factors: JSON.stringify(['exercise', 'social_interaction']),
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    }),
    prisma.moodEntry.create({
      data: {
        userId: testUser.id,
        moodLevel: 5,
        notes: 'Average day, some work stress',
        factors: JSON.stringify(['work_stress', 'sleep']),
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    }),
    prisma.moodEntry.create({
      data: {
        userId: testUser.id,
        moodLevel: 8,
        notes: 'Great day! Spent time with friends',
        factors: JSON.stringify(['social_interaction', 'hobbies']),
        timestamp: new Date(), // Today
      },
    }),
  ]);

  console.log('Created sample mood entries:', moodEntries.length);

  // Create sample CBT exercises
  const exercises = await Promise.all([
    prisma.cBTExercise.create({
      data: {
        title: 'Thought Challenging Exercise',
        description: 'Practice identifying and challenging negative thought patterns',
        category: 'THOUGHT_CHALLENGING',
        difficulty: 'BEGINNER',
        content: JSON.stringify({
          instructions: 'Identify a negative thought and challenge it with evidence',
          fields: [
            { type: 'textarea', label: 'Negative Thought', placeholder: 'What negative thought are you having?' },
            { type: 'textarea', label: 'Evidence For', placeholder: 'What evidence supports this thought?' },
            { type: 'textarea', label: 'Evidence Against', placeholder: 'What evidence contradicts this thought?' },
            { type: 'textarea', label: 'Balanced Thought', placeholder: 'What would be a more balanced way to view this?' }
          ]
        }),
        mediaUrls: 'https://example.com/thought-challenging-guide.jpg',
        isActive: true,
        status: 'PUBLISHED',
        createdBy: adminUser.id,
        reviewedBy: therapistUser.id,
        reviewedAt: new Date(),
        version: 1,
      },
    }),
    prisma.cBTExercise.create({
      data: {
        title: 'Deep Breathing Relaxation',
        description: 'Learn and practice deep breathing techniques for stress relief',
        category: 'RELAXATION',
        difficulty: 'BEGINNER',
        content: JSON.stringify({
          instructions: 'Follow the 4-7-8 breathing technique',
          fields: [
            { type: 'text', label: 'Duration', placeholder: 'How long did you practice? (minutes)' },
            { type: 'textarea', label: 'Experience', placeholder: 'How did you feel during and after?' }
          ]
        }),
        mediaUrls: 'https://example.com/breathing-exercise.mp3,https://example.com/breathing-guide.jpg',
        isActive: true,
        status: 'PUBLISHED',
        createdBy: adminUser.id,
        reviewedBy: therapistUser.id,
        reviewedAt: new Date(),
        version: 1,
      },
    }),
  ]);

  console.log('Created sample CBT exercises:', exercises.length);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });