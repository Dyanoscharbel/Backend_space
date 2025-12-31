import { getDatabase, connectToDatabase } from './config/database.js';

/**
 * Script to check researchers with allowStudentMessages enabled
 */
async function checkResearchers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await connectToDatabase();
        
        const db = getDatabase();
        const collection = db.collection('users');
        
        // Get all researchers
        const allResearchers = await collection.find({ role: 'researcher' }).toArray();
        console.log(`\n📊 Total researchers in database: ${allResearchers.length}`);
        
        // Show all researchers with their allowStudentMessages status
        console.log('\n📋 Researchers list:');
        console.log('─'.repeat(80));
        
        for (const researcher of allResearchers) {
            console.log(`\n👤 ${researcher.fullName || researcher.username || researcher.email}`);
            console.log(`   Email: ${researcher.email}`);
            console.log(`   allowStudentMessages: ${researcher.allowStudentMessages ?? 'undefined (not set)'}`);
            console.log(`   University: ${researcher.university || 'N/A'}`);
        }
        
        // Get researchers with allowStudentMessages: true
        const availableResearchers = await collection.find({ 
            role: 'researcher',
            allowStudentMessages: true
        }).toArray();
        
        console.log('\n' + '─'.repeat(80));
        console.log(`\n✅ Researchers available for students: ${availableResearchers.length}`);
        
        if (availableResearchers.length > 0) {
            console.log('\nAvailable researchers:');
            availableResearchers.forEach(r => {
                console.log(`  - ${r.fullName || r.email} (${r.email})`);
            });
        } else {
            console.log('\n⚠️  No researchers have enabled allowStudentMessages yet.');
            console.log('   Researchers need to go to their profile and enable "Accept Student Messages"');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkResearchers();
