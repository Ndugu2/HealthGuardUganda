import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * HealthGuard Uganda — Server Database Seeder
 * 
 * Seeds the national backend with:
 * 1. All knowledge base entries (read from the mobile app's knowledge_base.json)
 * 2. Default admin user for development
 */

interface KBEntry {
  topic: string;
  keyword: string;
  myth_text_en: string;
  correct_text_en: string;
  correct_text_lg?: string;
  detailed_guidance_en?: string;
  detailed_guidance_lg?: string;
  source?: string;
}

async function main() {
  console.log('🚀 Starting HealthGuard Uganda Database Seed...\n');

  // ─── STEP 1: Seed Knowledge Base from the master JSON ──────────────────────
  const kbPath = path.resolve(__dirname, '../../src/db/knowledge_base.json');
  let knowledgeData: KBEntry[] = [];

  try {
    const raw = fs.readFileSync(kbPath, 'utf-8');
    knowledgeData = JSON.parse(raw);
    console.log(`📚 Found ${knowledgeData.length} knowledge entries in master file`);
  } catch (e) {
    console.error('❌ Could not read knowledge_base.json:', e);
    console.log('⚠️  Falling back to manual seed...');
    knowledgeData = getFallbackData();
  }

  // Clear existing knowledge to prevent duplicates on re-seed
  await prisma.knowledgeItem.deleteMany();
  console.log('🗑️  Cleared existing knowledge items');

  // Insert all entries
  let inserted = 0;
  for (const item of knowledgeData) {
    await prisma.knowledgeItem.create({
      data: {
        topic: item.topic,
        keyword: item.keyword || null,
        mythTextEn: item.myth_text_en || null,
        correctTextEn: item.correct_text_en,
        correctTextLg: item.correct_text_lg || null,
        detailedGuidanceEn: item.detailed_guidance_en || null,
        detailedGuidanceLg: item.detailed_guidance_lg || null,
        source: item.source || null,
      },
    });
    inserted++;
  }
  console.log(`✅ Inserted ${inserted} knowledge entries into the database\n`);

  // Print topic breakdown
  const topicCounts = knowledgeData.reduce((acc, item) => {
    acc[item.topic] = (acc[item.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Knowledge Base Breakdown:');
  for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${topic.padEnd(15)} → ${count} entries`);
  }
  console.log('');

  // ─── STEP 2: Create Default Admin User ─────────────────────────────────────
  const adminPhone = '0700000000';
  const adminPassword = 'password123';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      phone: adminPhone,
      name: 'Dr. Mukasa John',
      password: hashedAdminPassword,
      role: 'ADMIN',
      district: 'Kampala',
      village: 'Kalerwe'
    }
  });
  console.log('👤 Default admin user created/verified (0700000000 / password123)');

  // Create a test health worker account
  const hwPhone = '0701000001';
  const hwPassword = 'healthworker1';
  const hashedHWPassword = await bcrypt.hash(hwPassword, 10);

  await prisma.user.upsert({
    where: { phone: hwPhone },
    update: {},
    create: {
      phone: hwPhone,
      name: 'Sarah Nalweyiso',
      password: hashedHWPassword,
      role: 'HW',
      district: 'Wakiso',
      village: 'Namugongo'
    }
  });
  console.log('👤 Test health worker created (0701000001 / healthworker1)\n');

  console.log('🎉 Seed completed successfully!');
}

/**
 * Fallback data in case the knowledge_base.json file is not accessible.
 */
function getFallbackData(): KBEntry[] {
  return [
    {
      topic: 'vaccination',
      keyword: 'infertility',
      myth_text_en: 'Vaccines cause infertility in women.',
      correct_text_en: 'Vaccines are rigorously tested and do not affect fertility.',
      correct_text_lg: 'Enkingo tezikosa kubeera n\'abaana.',
      source: 'WHO, 2023'
    },
    {
      topic: 'malaria',
      keyword: 'sugarcane_malaria',
      myth_text_en: 'Eating sugarcane or too much sun causes malaria.',
      correct_text_en: 'Fact: Malaria is only caused by the bite of an infected female Anopheles mosquito.',
      correct_text_lg: 'Fact: Omusujja gw\'ensiri gureetebwa nsiri, si ebikajjo oba musana.',
      source: 'MOH Uganda, 2021'
    },
    {
      topic: 'hiv',
      keyword: 'witchcraft',
      myth_text_en: 'HIV is caused by witchcraft.',
      correct_text_en: 'HIV is caused by a virus transmitted through fluids. It is managed by ART.',
      correct_text_lg: 'HIV ereetera omukutu gwa HIV, si obulogo. Eddagala lya ART liyamba.',
      source: 'UNAIDS, 2023'
    },
    {
      topic: 'nutrition',
      keyword: 'child_eggs',
      myth_text_en: 'Eggs are bad for young children and cause worms.',
      correct_text_en: 'Fact: Eggs are one of the most nutritious foods for children.',
      correct_text_lg: 'Fact: Amagi ge bimu ku birungo ebisinga obulungi eri abaana.',
      source: 'UNICEF Uganda, 2023'
    }
  ];
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
