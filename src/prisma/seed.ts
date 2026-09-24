/**
 * Database seed script.
 * Creates the default admin user and initial business data.
 * 
 * Run with: npx tsx src/prisma/seed.ts
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Admin User ──
  const passwordHash = await bcrypt.hash('SmokeMCustoms2024!', 12);

  const existingAdmin = await db.orm.public.AdminUser
    .where({ email: 'admin@smokecustoms.com' })
    .first();

  if (!existingAdmin) {
    await db.orm.public.AdminUser.create({
      name: 'Admin',
      email: 'admin@smokecustoms.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    });
    console.log('✅ Admin user created: admin@smokecustoms.com');
  } else {
    console.log('⏭️  Admin user already exists');
  }

  // ── 2. Default Resource (Bay) ──
  const existingResource = await db.orm.public.Resource
    .where({ name: 'Bay 1' })
    .first();

  if (!existingResource) {
    await db.orm.public.Resource.create({
      name: 'Bay 1',
      isActive: true,
    });
    console.log('✅ Default resource created: Bay 1');
  } else {
    console.log('⏭️  Default resource already exists');
  }

  // ── 3. Business Hours (Mon-Sat 10:00-19:00) ──
  const existingHours = await db.orm.public.BusinessHours.all();

  if (existingHours.length === 0) {
    const daysOfWeek = [
      { dayOfWeek: 1, startTime: '10:00', endTime: '19:00' }, // Monday
      { dayOfWeek: 2, startTime: '10:00', endTime: '19:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '10:00', endTime: '19:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '10:00', endTime: '19:00' }, // Thursday
      { dayOfWeek: 5, startTime: '10:00', endTime: '19:00' }, // Friday
      { dayOfWeek: 6, startTime: '10:00', endTime: '17:00' }, // Saturday (shorter)
    ];

    for (const day of daysOfWeek) {
      await db.orm.public.BusinessHours.create(day);
    }
    console.log('✅ Business hours created (Mon-Sat)');
  } else {
    console.log('⏭️  Business hours already exist');
  }

  // ── 4. Sample Services ──
  const existingServices = await db.orm.public.Service.all();

  if (existingServices.length === 0) {
    const services = [
      {
        slug: 'ceramic-coating',
        name: 'Ceramic Coating',
        description: 'Professional-grade ceramic coating for long-lasting paint protection. Provides hydrophobic properties, UV resistance, and a deep glossy finish that lasts years.',
        category: 'Paint Protection',
        startingPrice: '15000',
        durationMinutes: 480,
        warrantyText: '2-5 years warranty depending on coating grade',
        benefits: ['UV Protection', 'Hydrophobic', 'Scratch Resistance', 'Deep Gloss', 'Easy Maintenance'],
        isEnabled: true,
        isBookable: true,
        sortOrder: 1,
      },
      {
        slug: 'paint-protection-film',
        name: 'Paint Protection Film (PPF)',
        description: 'Self-healing thermoplastic urethane film that protects your paint from rock chips, scratches, stains, and environmental damage.',
        category: 'Paint Protection',
        startingPrice: '25000',
        durationMinutes: 960,
        warrantyText: '5-10 years warranty',
        benefits: ['Self-Healing', 'Rock Chip Protection', 'Stain Resistance', 'UV Protection', 'Invisible Protection'],
        isEnabled: true,
        isBookable: true,
        sortOrder: 2,
      },
      {
        slug: 'interior-detailing',
        name: 'Interior Detailing',
        description: 'Deep cleaning and restoration of your vehicle\'s interior including leather conditioning, fabric shampooing, dashboard treatment, and odor elimination.',
        category: 'Detailing',
        startingPrice: '5000',
        durationMinutes: 240,
        benefits: ['Deep Cleaning', 'Leather Conditioning', 'Odor Elimination', 'UV Dashboard Protection'],
        isEnabled: true,
        isBookable: true,
        sortOrder: 3,
      },
      {
        slug: 'exterior-detailing',
        name: 'Exterior Detailing',
        description: 'Comprehensive exterior care including foam wash, clay bar treatment, paint correction, and sealant application for a showroom finish.',
        category: 'Detailing',
        startingPrice: '3000',
        durationMinutes: 180,
        benefits: ['Foam Wash', 'Clay Bar', 'Paint Correction', 'Sealant', 'Wheel Detailing'],
        isEnabled: true,
        isBookable: true,
        sortOrder: 4,
      },
      {
        slug: 'paint-correction',
        name: 'Paint Correction',
        description: 'Multi-stage machine polishing to remove swirl marks, scratches, oxidation, and other paint imperfections for a flawless mirror finish.',
        category: 'Paint Correction',
        startingPrice: '8000',
        durationMinutes: 360,
        benefits: ['Swirl Removal', 'Scratch Repair', 'Mirror Finish', 'Paint Restoration'],
        isEnabled: true,
        isBookable: true,
        sortOrder: 5,
      },
      {
        slug: 'windshield-coating',
        name: 'Windshield Coating',
        description: 'Hydrophobic windshield coating for improved visibility during rain and easier cleaning.',
        category: 'Coatings',
        startingPrice: '2000',
        durationMinutes: 60,
        warrantyText: '1 year warranty',
        benefits: ['Rain Repellent', 'Better Visibility', 'Easy Cleaning'],
        isEnabled: true,
        isBookable: true,
        sortOrder: 6,
      },
    ];

    for (const service of services) {
      await db.orm.public.Service.create(service);
    }
    console.log(`✅ ${services.length} services created`);
  } else {
    console.log('⏭️  Services already exist');
  }

  // ── 5. Second Resource (Bay 2) ──
  const existingBay2 = await db.orm.public.Resource
    .where({ name: 'Bay 2' })
    .first();

  if (!existingBay2) {
    await db.orm.public.Resource.create({
      name: 'Bay 2',
      isActive: true,
    });
    console.log('✅ Secondary resource created: Bay 2');
  }

  // ── 6. Sample Packages ──
  const existingPackages = await db.orm.public.Package.all();

  if (existingPackages.length === 0) {
    const p1 = await db.orm.public.Package.create({
      slug: 'ceramic-shield-pro',
      name: 'Ceramic Shield Pro',
      description: 'The ultimate protection package. Includes 3-stage paint correction, 9H Ceramic Coating with 3-year warranty, windshield coating, and deep interior sterilization.',
      price: '22000',
      startingPrice: '22000',
      durationMinutes: 600,
      benefits: ['3-Stage Paint Correction', '9H Dual-Layer Ceramic Coating', 'Hydrophobic Windshield Treatment', 'Interior Anti-Bacterial Detailing', '3-Year Warranty Card'],
      warrantyText: '3 Years Warranty with free 6-month inspection',
      validityText: 'Available year-round',
      terms: 'Vehicle must be dropped off for a minimum of 24 hours for proper curing.',
      isEnabled: true,
      isBookable: true,
      sortOrder: 1,
    });

    const p2 = await db.orm.public.Package.create({
      slug: 'full-ppf-armor',
      name: 'Full PPF Armor Package',
      description: 'Comprehensive TPU Self-Healing Paint Protection Film for full bumper, bonnet, fenders, mirrors, and door edges, plus ceramic coating over remaining surfaces.',
      price: '65000',
      startingPrice: '65000',
      durationMinutes: 1200,
      benefits: ['Full Front End & Impact Zone TPU Film', 'Self-Healing Heat Activation', 'Hydrophobic Topcoat', '10-Year Anti-Yellowing Warranty', 'Door Edge & Cup Protection'],
      warrantyText: '10 Years Manufacturer Warranty',
      validityText: 'Subject to film stock availability',
      terms: 'Requires 48-hour workshop stay.',
      isEnabled: true,
      isBookable: true,
      sortOrder: 2,
    });

    const p3 = await db.orm.public.Package.create({
      slug: 'signature-spa-detail',
      name: 'Signature Spa & Polish',
      description: 'Complete restorative package: engine bay detailing, interior leather feeding, fabric steam wash, paint gloss enhancement, and carnauba wax sealing.',
      price: '8500',
      startingPrice: '8500',
      durationMinutes: 300,
      benefits: ['High-Pressure Foam Bath', 'Engine Bay Detail & Dressing', 'Leather Conditioning Treatment', 'Clay Bar & 1-Stage Gloss Polish', 'Superhydrophobic Sealant'],
      warrantyText: '6 Months Gloss Protection',
      validityText: 'Same day delivery',
      terms: 'Takes approximately 5-6 hours.',
      isEnabled: true,
      isBookable: true,
      sortOrder: 3,
    });

    console.log('✅ 3 packages created');
  } else {
    console.log('⏭️  Packages already exist');
  }

  // ── 6b. Package-Service Associations ──
  const existingPkgServices = await db.orm.public.PackageService.all();
  if (existingPkgServices.length === 0) {
    const allServices = await db.orm.public.Service.all();
    const allPkgs = await db.orm.public.Package.all();

    const ceramicSvc = allServices.find((s) => s.slug === 'ceramic-coating');
    const ppfSvc = allServices.find((s) => s.slug === 'paint-protection-film');
    const interiorSvc = allServices.find((s) => s.slug === 'interior-detailing');
    const exteriorSvc = allServices.find((s) => s.slug === 'exterior-detailing');
    const paintCorrectionSvc = allServices.find((s) => s.slug === 'paint-correction');
    const windshieldSvc = allServices.find((s) => s.slug === 'windshield-coating');

    const p1 = allPkgs.find((p) => p.slug === 'ceramic-shield-pro');
    const p2 = allPkgs.find((p) => p.slug === 'full-ppf-armor');
    const p3 = allPkgs.find((p) => p.slug === 'signature-spa-detail');

    if (p1) {
      if (ceramicSvc) await db.orm.public.PackageService.create({ packageId: p1.id, serviceId: ceramicSvc.id });
      if (paintCorrectionSvc) await db.orm.public.PackageService.create({ packageId: p1.id, serviceId: paintCorrectionSvc.id });
      if (windshieldSvc) await db.orm.public.PackageService.create({ packageId: p1.id, serviceId: windshieldSvc.id });
      if (interiorSvc) await db.orm.public.PackageService.create({ packageId: p1.id, serviceId: interiorSvc.id });
    }

    if (p2) {
      if (ppfSvc) await db.orm.public.PackageService.create({ packageId: p2.id, serviceId: ppfSvc.id });
      if (ceramicSvc) await db.orm.public.PackageService.create({ packageId: p2.id, serviceId: ceramicSvc.id });
    }

    if (p3) {
      if (exteriorSvc) await db.orm.public.PackageService.create({ packageId: p3.id, serviceId: exteriorSvc.id });
      if (interiorSvc) await db.orm.public.PackageService.create({ packageId: p3.id, serviceId: interiorSvc.id });
    }

    console.log('✅ Package-Service associations created');
  } else {
    console.log('⏭️  Package-Service associations already exist');
  }

  // ── 7. Sample Reviews ──
  const existingReviews = await db.orm.public.Review.all();

  if (existingReviews.length === 0) {
    const reviews = [
      {
        customerName: 'Vikram Malhotra',
        rating: 5,
        body: 'Got full PPF done on my BMW 330i at Smoke M Customs. The finish is immaculate, not a single bubble or lift edge. The staff is passionate and transparent about pricing.',
        vehicleText: 'BMW 330i M Sport',
        isFeatured: true,
        isPublished: true,
        reviewDate: new Date('2024-08-15').toISOString(),
      },
      {
        customerName: 'Aditya Singhania',
        rating: 5,
        body: 'Hands down the best detailing studio in town. Did ceramic coating for my Thar and the hydrophobic effect during monsoons was insane. Water just sheets off!',
        vehicleText: 'Mahindra Thar 4x4',
        isFeatured: true,
        isPublished: true,
        reviewDate: new Date('2024-09-02').toISOString(),
      },
      {
        customerName: 'Neha Sharma',
        rating: 5,
        body: 'Brought in my Hyundai Creta for an interior deep clean and exterior polish. Looked and smelled better than showroom delivery day. Super professional team!',
        vehicleText: 'Hyundai Creta SX',
        isFeatured: true,
        isPublished: true,
        reviewDate: new Date('2024-09-10').toISOString(),
      },
      {
        customerName: 'Karan Mehra',
        rating: 5,
        body: 'Very impressed with their paint correction work. Removed years of swirl marks created by local car wash guys. The mirror reflection is mind-blowing.',
        vehicleText: 'Mercedes-Benz C-Class',
        isFeatured: true,
        isPublished: true,
        reviewDate: new Date('2024-09-18').toISOString(),
      },
    ];

    for (const r of reviews) {
      await db.orm.public.Review.create(r);
    }
    console.log(`✅ ${reviews.length} reviews created`);
  } else {
    console.log('⏭️  Reviews already exist');
  }

  // ── 8. Sample Offers ──
  const existingOffers = await db.orm.public.Offer.all();

  if (existingOffers.length === 0) {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 45);

    await db.orm.public.Offer.create({
      title: 'Monsoon Shield Special: Flat 15% Off Ceramic Coating',
      description: 'Protect your paint from acid rain, mud splatters, and water spots with our 9H Ceramic Coating. Free windshield rain repellent treatment included.',
      startAt: new Date().toISOString(),
      endAt: nextMonth.toISOString(),
      isEnabled: true,
    });
    console.log('✅ Sample offer created');
  } else {
    console.log('⏭️  Offers already exist');
  }

  // ── 9. Sample Gallery Items ──
  const existingGallery = await db.orm.public.GalleryItem.all();

  if (existingGallery.length === 0) {
    const m1 = await db.orm.public.Media.create({
      url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
      type: 'IMAGE',
      altText: 'BMW M4 Before Paint Correction',
      provider: 'unsplash',
    });
    const m2 = await db.orm.public.Media.create({
      url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
      type: 'IMAGE',
      altText: 'BMW M4 After 9H Ceramic Coating',
      provider: 'unsplash',
    });

    await db.orm.public.GalleryItem.create({
      title: 'BMW M4 Competition — 9H Ceramic Coating & Mirror Finish',
      slug: 'bmw-m4-ceramic-coating',
      description: 'Complete 3-stage swirl elimination followed by dual-layer 9H nano-ceramic coating. Look at the deep gloss and metallic flake clarity.',
      serviceCategory: 'Paint Protection',
      vehicleBrand: 'BMW',
      vehicleModel: 'M4 Competition',
      tags: ['Ceramic Coating', 'Swirl Removal', 'BMW', 'Mirror Finish'],
      isFeatured: true,
      isPublished: true,
      beforeMediaId: m1.id,
      afterMediaId: m2.id,
    });

    const m3 = await db.orm.public.Media.create({
      url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
      type: 'IMAGE',
      altText: 'Porsche 911 Before PPF Wrap',
      provider: 'unsplash',
    });
    const m4 = await db.orm.public.Media.create({
      url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      type: 'IMAGE',
      altText: 'Porsche 911 After Full TPU PPF',
      provider: 'unsplash',
    });

    await db.orm.public.GalleryItem.create({
      title: 'Porsche 911 GT3 — Full Body TPU Paint Protection Film',
      slug: 'porsche-911-gt3-ppf',
      description: 'Bespoke edge-wrapped PPF installation ensuring zero seams. Self-healing film prevents stone chips and micro-scratches from track days.',
      serviceCategory: 'Paint Protection',
      vehicleBrand: 'Porsche',
      vehicleModel: '911 GT3',
      tags: ['PPF', 'Self Healing', 'Porsche', 'Track Ready'],
      isFeatured: true,
      isPublished: true,
      beforeMediaId: m3.id,
      afterMediaId: m4.id,
    });

    console.log('✅ 2 gallery items created');
  } else {
    console.log('⏭️  Gallery items already exist');
  }

  console.log('\n🎉 Seeding complete!\n');
  console.log('Admin credentials:');
  console.log('  Email:    admin@smokecustoms.com');
  console.log('  Password: SmokeMCustoms2024!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Close the database connection
    process.exit(0);
  });
