import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const data = [
    {
      topic: 'vaccination',
      keyword: 'infertility',
      mythTextEn: 'Vaccines cause infertility in women.',
      correctTextEn: 'Vaccines are rigorously tested and do not affect fertility. The WHO confirms that no vaccine causes infertility.',
      correctTextLg: 'Ennema (vaccines) teziviirako muntu butazaala. Ekitongole ky\'ebyobulamu ekiggwa mu nsi yonna (WHO) kikakasizza nti tewali nnema eviirako butazaala.',
      source: 'Uganda Ministry of Health'
    },
    {
      topic: 'malaria',
      keyword: 'papaya',
      mythTextEn: 'Eating papaya seeds cures malaria.',
      correctTextEn: 'Malaria must be treated with approved anti-malarial drugs like ACTs. Papaya seeds are not a cure.',
      correctTextLg: 'Omusujja gw\'ensiri (Malaria) gulina okujjanjabibwa n\'eddagala eryakkirizibwa nga ACTs. Ensigo z\'epapaayi si ddagala lya musujja.',
      source: 'Uganda Ministry of Health'
    },
    {
      topic: 'sanitation',
      keyword: 'ebola',
      mythTextEn: 'Ebola is spread through the air.',
      correctTextEn: 'Ebola is spread through direct contact with body fluids of an infected person. It is not airborne.',
      correctTextLg: 'Ebola asaasaanyizibwa okukwatagana n\'amazzi agava mu mubiri gw\'omuntu alwadde (nga omusaayi oba amalusu). Ebola tusaasaanyizibwa mu mpewo.',
      source: 'Uganda Ministry of Health'
    }
  ];

  for (const item of data) {
    await prisma.knowledgeItem.create({
      data: item,
    });
  }

  // Create Default Admin User
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

  console.log('Seed data inserted successfully (including default admin)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
