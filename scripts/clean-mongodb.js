#!/usr/bin/env node

/**
 * MongoDB Database Cleanup Script
 * 
 * ამ script-ით შეგიძლიათ გაასუფთავოთ MongoDB ბაზა
 * 
 * გამოყენება:
 *   node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb"
 *   node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --collections "users,cars"
 *   node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --dry-run (მხოლოდ preview)
 *   node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --drop-database (ყველა database-ის წაშლა)
 */

const { MongoClient } = require('mongodb');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
};

const uri = getArg('--uri') || process.env.MONGODB_URI;
const databaseName = getArg('--database') || getArg('--db');
const collectionsArg = getArg('--collections'); // comma-separated list
const dryRun = args.includes('--dry-run');
const dropDatabase = args.includes('--drop-database');
const confirm = args.includes('--yes') || args.includes('-y');

if (!uri) {
  console.error('❌ MongoDB URI არ არის მითითებული!');
  console.error('\nგამოყენება:');
  console.error('  node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb"');
  console.error('  node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --collections "users,cars"');
  console.error('  node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --dry-run');
  console.error('  node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --drop-database --yes');
  console.error('\nან განსაზღვრეთ MONGODB_URI environment variable-ი:');
  console.error('  MONGODB_URI="mongodb://..." node scripts/clean-mongodb.js --database "mydb"');
  process.exit(1);
}

if (!databaseName && !dropDatabase) {
  console.error('❌ Database სახელი არ არის მითითებული!');
  console.error('\nგამოყენება:');
  console.error('  node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb"');
  process.exit(1);
}

async function cleanMongoDB() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 MongoDB-სთან დაკავშირება...');
    await client.connect();
    console.log('✅ დაკავშირება წარმატებულია!\n');

    const admin = client.db().admin();
    
    if (dropDatabase) {
      // Show all databases
      const databases = await admin.listDatabases();
      console.log('📊 ყველა databases:');
      databases.databases.forEach(db => {
        console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      });
      console.log();

      if (!confirm && !dryRun) {
        console.log('⚠️  გაფრთხილება: ეს წაშლის მთელ database-ს!');
        console.log('გაგრძელებისთვის გამოიყენეთ --yes ან -y flag');
        await client.close();
        return;
      }

      if (dryRun) {
        console.log('🔍 DRY RUN: database-ები წაიშლება (მაგრამ არ მოხდა)');
      } else {
        if (databaseName) {
          const db = client.db(databaseName);
          await db.dropDatabase();
          console.log(`✅ Database "${databaseName}" წაიშალა!`);
        } else {
          console.log('❌ Database სახელი არ არის მითითებული drop-database-ისთვის');
        }
      }
      await client.close();
      return;
    }

    const db = client.db(databaseName);

    // Get list of collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`📊 Database: ${databaseName}`);
    console.log(`📁 Collections (${collectionNames.length}):`);
    
    // Show collection stats
    for (const collName of collectionNames) {
      const coll = db.collection(collName);
      const count = await coll.countDocuments();
      console.log(`  - ${collName}: ${count} documents`);
    }
    console.log();

    // Determine which collections to clean
    let collectionsToClean = collectionNames;
    if (collectionsArg) {
      const requestedCollections = collectionsArg.split(',').map(s => s.trim());
      collectionsToClean = requestedCollections.filter(name => collectionNames.includes(name));
      
      const notFound = requestedCollections.filter(name => !collectionNames.includes(name));
      if (notFound.length > 0) {
        console.log(`⚠️  Collections არ მოიძებნა: ${notFound.join(', ')}`);
      }
    }

    if (collectionsToClean.length === 0) {
      console.log('ℹ️  გასასუფთავებელი collections არ არის.');
      await client.close();
      return;
    }

    console.log(`🎯 გასასუფთავებელი collections (${collectionsToClean.length}):`);
    collectionsToClean.forEach(name => console.log(`  - ${name}`));
    console.log();

    if (dryRun) {
      console.log('🔍 DRY RUN: collections გაიწმენდება (მაგრამ არ მოხდა)');
      for (const collName of collectionsToClean) {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        console.log(`  - ${collName}: ${count} documents წაიშლება`);
      }
      console.log('\n✅ DRY RUN დასრულდა - არაფერი არ შეიცვალა');
      await client.close();
      return;
    }

    if (!confirm) {
      console.log('⚠️  გაფრთხილება: ეს წაშლის ყველა documents-ს ამ collections-ში!');
      console.log('გაგრძელებისთვის გამოიყენეთ --yes ან -y flag');
      await client.close();
      return;
    }

    // Clean collections
    console.log('🧹 Collections-ის გასუფთავება...\n');
    
    for (const collName of collectionsToClean) {
      const coll = db.collection(collName);
      const countBefore = await coll.countDocuments();
      
      if (countBefore === 0) {
        console.log(`⏭️  ${collName}: ცარიელია, გამოტოვებულია`);
        continue;
      }

      await coll.deleteMany({});
      console.log(`✅ ${collName}: წაიშალა ${countBefore} documents`);
    }

    console.log('\n✅ ყველა collections გაიწმენდა!');

    // Show final stats
    console.log('\n📊 ბოლოს:');
    for (const collName of collectionNames) {
      const coll = db.collection(collName);
      const count = await coll.countDocuments();
      console.log(`  - ${collName}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ შეცდომა:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 კავშირი დახურულია');
  }
}

cleanMongoDB();



