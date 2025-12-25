#!/usr/bin/env node

/**
 * Device Tokens Export Script
 * 
 * ამ script-ით შეგიძლიათ ამოიღოთ device tokens MongoDB ბაზიდან
 * 
 * გამოყენება:
 *   node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb"
 *   node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb" --format json
 *   node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb" --format csv --output tokens.csv
 *   node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb" --user-id "user123"
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
};

const uri = getArg('--uri') || process.env.MONGODB_URI;
const databaseName = getArg('--database') || getArg('--db');
const format = getArg('--format') || 'json'; // json, csv, txt
const outputFile = getArg('--output') || getArg('-o');
const userId = getArg('--user-id') || getArg('--userId');
const platform = getArg('--platform'); // ios, android
const collectionName = getArg('--collection') || 'devices'; // devices, device_tokens, notifications

if (!uri) {
  console.error('❌ MongoDB URI არ არის მითითებული!');
  console.error('\nგამოყენება:');
  console.error('  node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb"');
  console.error('  node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb" --format csv --output tokens.csv');
  console.error('  node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb" --user-id "user123"');
  console.error('\nან განსაზღვრეთ MONGODB_URI environment variable-ი:');
  console.error('  MONGODB_URI="mongodb://..." node scripts/export-device-tokens.js --database "mydb"');
  process.exit(1);
}

if (!databaseName) {
  console.error('❌ Database სახელი არ არის მითითებული!');
  console.error('\nგამოყენება:');
  console.error('  node scripts/export-device-tokens.js --uri "mongodb://..." --database "mydb"');
  process.exit(1);
}

async function exportDeviceTokens() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 MongoDB-სთან დაკავშირება...');
    await client.connect();
    console.log('✅ დაკავშირება წარმატებულია!\n');

    const db = client.db(databaseName);
    
    // სხვადასხვა collection-ების შემოწმება
    const possibleCollections = [collectionName, 'device_tokens', 'devices', 'notifications', 'users'];
    let collection = null;
    let foundCollection = null;

    for (const collName of possibleCollections) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        if (count > 0) {
          foundCollection = collName;
          collection = coll;
          console.log(`📁 ნაპოვნია collection: ${collName} (${count} documents)`);
          break;
        }
      } catch (e) {
        // Collection არ არსებობს
      }
    }

    if (!collection) {
      console.log('\n⚠️  Device tokens collection არ მოიძებნა!');
      console.log('სცადე სხვა collection-ის სახელი:');
      console.log('  --collection device_tokens');
      console.log('  --collection devices');
      console.log('  --collection notifications');
      
      // ვნახოთ რა collections არსებობს
      const allCollections = await db.listCollections().toArray();
      console.log('\n📊 ხელმისაწვდომი collections:');
      for (const coll of allCollections) {
        const collObj = db.collection(coll.name);
        const count = await collObj.countDocuments();
        console.log(`  - ${coll.name}: ${count} documents`);
      }
      
      await client.close();
      return;
    }

    // Query-ის აგება
    const query = {};
    if (userId) {
      query.userId = userId;
    }
    if (platform) {
      query.platform = platform;
    }

    console.log(`\n🔍 ძებნა tokens...`);
    if (userId) console.log(`   User ID: ${userId}`);
    if (platform) console.log(`   Platform: ${platform}`);
    console.log(`   Collection: ${foundCollection}\n`);

    // ვნახოთ რა სტრუქტურა აქვს documents-ს
    const sample = await collection.findOne(query);
    if (!sample) {
      console.log('❌ Tokens არ მოიძებნა მითითებული კრიტერიუმებით!');
      await client.close();
      return;
    }

    console.log('📋 Sample document structure:');
    console.log(JSON.stringify(sample, null, 2));
    console.log('\n');

    // Token-ების ამოღება
    const tokens = await collection.find(query).toArray();
    console.log(`✅ ნაპოვნია ${tokens.length} device token(s)\n`);

    if (tokens.length === 0) {
      console.log('ℹ️  Tokens არ არის.');
      await client.close();
      return;
    }

    // Data-ს ფორმატირება
    let output = '';
    let filename = outputFile;

    if (format === 'json') {
      output = JSON.stringify(tokens, null, 2);
      if (!filename) filename = `device-tokens-${Date.now()}.json`;
    } else if (format === 'csv') {
      // CSV header
      const headers = ['userId', 'token', 'platform', 'createdAt', 'updatedAt'];
      output = headers.join(',') + '\n';
      
      // CSV rows
      tokens.forEach(token => {
        const row = [
          token.userId || '',
          token.token || token.fcmToken || token.deviceToken || '',
          token.platform || '',
          token.createdAt ? new Date(token.createdAt).toISOString() : '',
          token.updatedAt ? new Date(token.updatedAt).toISOString() : ''
        ];
        output += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      
      if (!filename) filename = `device-tokens-${Date.now()}.csv`;
    } else if (format === 'txt') {
      // მარტივი ტექსტური ფორმატი - მხოლოდ tokens
      output = tokens.map(t => t.token || t.fcmToken || t.deviceToken || '').filter(Boolean).join('\n');
      if (!filename) filename = `device-tokens-${Date.now()}.txt`;
    }

    // ფაილში შენახვა
    if (filename) {
      const filePath = path.resolve(filename);
      fs.writeFileSync(filePath, output, 'utf8');
      console.log(`💾 Tokens შენახულია: ${filePath}`);
      console.log(`📊 ფაილის ზომა: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB\n`);
    } else {
      // Console-ში გამოტანა
      console.log('📄 Tokens:\n');
      console.log(output);
    }

    // სტატისტიკა
    console.log('📊 სტატისტიკა:');
    const platforms = {};
    tokens.forEach(t => {
      const p = t.platform || 'unknown';
      platforms[p] = (platforms[p] || 0) + 1;
    });
    
    Object.entries(platforms).forEach(([p, count]) => {
      console.log(`   ${p}: ${count} token(s)`);
    });

    const uniqueUsers = new Set(tokens.map(t => t.userId).filter(Boolean));
    console.log(`   Unique users: ${uniqueUsers.size}`);

  } catch (error) {
    console.error('❌ შეცდომა:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 კავშირი დახურულია');
  }
}

exportDeviceTokens();


