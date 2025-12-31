import { getDatabase, connectToDatabase } from './config/database.js';

/**
 * Script to set default allowStudentMessages value for existing researchers
 */
async function updateResearchers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await connectToDatabase();
        
        const db = getDatabase();
        const collection = db.collection('users');
        
        // Update all researchers that don't have allowStudentMessages set
        const result = await collection.updateMany(
            { 
                role: 'researcher',
                allowStudentMessages: { $exists: false }
            },
            { 
                $set: { allowStudentMessages: false }
            }
        );
        
        console.log(`\n✅ Updated ${result.modifiedCount} researcher(s) with default allowStudentMessages: false`);
        
        // Show current status
        const allResearchers = await collection.find({ role: 'researcher' }).toArray();
        
        console.log('\n📋 Current researchers status:');
        console.log('─'.repeat(80));
        
        for (const researcher of allResearchers) {
            console.log(`\n👤 ${researcher.fullName || researcher.username || researcher.email}`);
            console.log(`   Email: ${researcher.email}`);
            console.log(`   allowStudentMessages: ${researcher.allowStudentMessages}`);
        }
        
        console.log('\n' + '─'.repeat(80));
        console.log('\n💡 Researchers can now enable this option in their profile settings.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateResearchers();
