/** @format */

/**
 * Test script to verify adoptionFormUrl field is properly saved in MongoDB
 * 
 * Run this with: node test-adoption-form-urls.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const Adoption = require('./Models/adoptionModels');

async function testAdoptionFormUrls() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Check schema
    console.log('📋 Test 1: Checking Adoption Schema...');
    const schema = Adoption.schema.obj;
    console.log('Schema has adoptionFormUrl field:', 'adoptionFormUrl' in schema);
    console.log('adoptionFormUrl field config:', schema.adoptionFormUrl);
    console.log('');
    
    // Test 2: Get all adoptions and check adoptionFormUrl
    console.log('📋 Test 2: Fetching all adoptions...');
    const adoptions = await Adoption.find({})
      .populate('pet', 'name')
      .populate('user', 'fullname email')
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`Found ${adoptions.length} adoptions\n`);
    
    // Test 3: Analyze adoption form URLs
    console.log('📊 Test 3: Analyzing adoption form URLs...');
    
    let withUrl = 0;
    let withoutUrl = 0;
    let withEmptyUrl = 0;
    
    adoptions.forEach((adoption, index) => {
      const hasUrl = adoption.adoptionFormUrl && adoption.adoptionFormUrl.trim() !== '';
      const isEmpty = adoption.adoptionFormUrl === '';
      const isUndefined = adoption.adoptionFormUrl === undefined;
      
      if (hasUrl) {
        withUrl++;
      } else if (isEmpty) {
        withEmptyUrl++;
      } else {
        withoutUrl++;
      }
      
      console.log(`\nAdoption ${index + 1}:`, {
        id: adoption._id.toString(),
        adopter: adoption.user?.fullname || adoption.fullname || 'Unknown',
        email: adoption.user?.email || adoption.email || 'Unknown',
        pet: adoption.pet?.name || 'Unknown',
        status: adoption.status,
        createdAt: adoption.createdAt.toLocaleDateString(),
        hasAdoptionFormUrl: hasUrl,
        adoptionFormUrlLength: adoption.adoptionFormUrl ? adoption.adoptionFormUrl.length : 0,
        adoptionFormUrl: adoption.adoptionFormUrl ? adoption.adoptionFormUrl.substring(0, 50) + '...' : 'MISSING',
        fieldExists: 'adoptionFormUrl' in adoption.toObject(),
        isEmpty: isEmpty,
        isUndefined: isUndefined,
      });
    });
    
    console.log('\n📊 Summary:');
    console.log(`Total adoptions: ${adoptions.length}`);
    console.log(`With valid URL: ${withUrl}`);
    console.log(`With empty string: ${withEmptyUrl}`);
    console.log(`Without field: ${withoutUrl}`);
    console.log('');
    
    // Test 4: Create a test adoption with adoptionFormUrl
    console.log('📋 Test 4: Creating test adoption with adoptionFormUrl...');
    
    const testAdoption = new Adoption({
      pet: new mongoose.Types.ObjectId(), // Dummy pet ID
      fullname: 'Test User',
      email: 'test@example.com',
      phone: '+63 912 345 6789',
      address: 'Test Address 123',
      message: 'This is a test adoption request',
      status: 'Pending',
      adoptionFormUrl: 'https://test-supabase-url.com/test-file.pdf',
    });
    
    console.log('Before save - adoptionFormUrl:', testAdoption.adoptionFormUrl);
    
    await testAdoption.save();
    
    console.log('✅ Test adoption created with ID:', testAdoption._id);
    console.log('After save - adoptionFormUrl:', testAdoption.adoptionFormUrl);
    
    // Fetch it back to verify
    const fetchedAdoption = await Adoption.findById(testAdoption._id);
    console.log('After fetch - adoptionFormUrl:', fetchedAdoption.adoptionFormUrl);
    console.log('Has adoptionFormUrl in fetched document:', 'adoptionFormUrl' in fetchedAdoption.toObject());
    
    // Clean up test adoption
    await Adoption.findByIdAndDelete(testAdoption._id);
    console.log('✅ Test adoption deleted\n');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run tests
testAdoptionFormUrls();
