import { connectToDatabase, closeDatabase } from '../config/database.js';
import { getDatabase } from '../config/database.js';

/**
 * Script pour mettre à jour les utilisateurs existants avec emailNotifications par défaut
 */
async function updateEmailNotifications() {
    try {
        console.log('🔄 Starting email notifications update...');
        
        await connectToDatabase();
        const db = getDatabase();
        const collection = db.collection('users');

        // Mettre à jour tous les utilisateurs qui n'ont pas le champ emailNotifications
        const result = await collection.updateMany(
            { emailNotifications: { $exists: false } },
            { $set: { emailNotifications: true } }
        );

        console.log(`✅ Updated ${result.modifiedCount} users with default emailNotifications: true`);

        // Afficher les statistiques
        const totalUsers = await collection.countDocuments();
        const withNotifications = await collection.countDocuments({ emailNotifications: true });
        const withoutNotifications = await collection.countDocuments({ emailNotifications: false });

        console.log('\n📊 Email Notifications Statistics:');
        console.log(`   Total users: ${totalUsers}`);
        console.log(`   With notifications enabled: ${withNotifications}`);
        console.log(`   With notifications disabled: ${withoutNotifications}`);

        // Afficher quelques exemples
        const users = await collection
            .find({ email: { $exists: true } })
            .project({ email: 1, fullName: 1, role: 1, emailNotifications: 1 })
            .limit(5)
            .toArray();

        console.log('\n👤 Sample users:');
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.role}): emailNotifications = ${user.emailNotifications ?? 'undefined'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await closeDatabase();
        console.log('\n✅ Script completed');
        process.exit(0);
    }
}

// Exécuter le script
updateEmailNotifications();
