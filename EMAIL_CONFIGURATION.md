# Configuration des Notifications Email

## Vue d'ensemble

Le système ExoScope envoie automatiquement des notifications par email à tous les utilisateurs enregistrés lorsqu'une synchronisation de données NASA est effectuée (manuellement ou automatiquement).

## Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

### 2. Configuration Gmail (Recommandé)

Si vous utilisez Gmail, suivez ces étapes :

#### Étape 1 : Activer l'authentification à deux facteurs
1. Allez sur https://myaccount.google.com/security
2. Activez "Validation en deux étapes"

#### Étape 2 : Créer un mot de passe d'application
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Mail" et "Autre (nom personnalisé)"
3. Entrez "ExoScope" comme nom
4. Copiez le mot de passe généré (16 caractères)
5. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

#### Configuration finale pour Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:3000
```

### 3. Autres fournisseurs d'email

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### SendGrid (Production recommandé)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

## Fonctionnalités

### Déclenchement automatique
- Les emails sont envoyés automatiquement après chaque synchronisation
- Synchronisation manuelle (déclenchée par admin) → Email avec badge "Manuelle"
- Synchronisation automatique (planifiée) → Email avec badge "Automatique"

### Contenu de l'email
- 🎨 Design moderne avec gradient cosmique
- 📊 Statistiques de synchronisation :
  - Nombre de nouveaux KOIs
  - Nombre d'objets traités
  - Planètes confirmées
  - Candidats
- 🔗 Lien direct vers le dashboard
- 📱 Responsive (mobile-friendly)

### Destinataires
- Tous les utilisateurs avec un email valide dans la base de données
- Rôles : Admin, Chercheur, Étudiant

## Test de la configuration

### 1. Vérifier au démarrage du serveur
```bash
cd Backend_space
pnpm dev
```

Vous devriez voir :
```
✅ Email service initialized successfully
```

Si vous voyez :
```
⚠️ Email credentials not configured. Email notifications will be disabled.
```
Vérifiez vos variables d'environnement.

### 2. Tester avec une synchronisation manuelle
1. Connectez-vous en tant qu'admin
2. Allez sur la page `/sync`
3. Cliquez sur "Start Sync"
4. Vérifiez vos emails (tous les utilisateurs devraient recevoir une notification)

### 3. Console logs
Pendant la synchronisation, vous verrez :
```
📧 Sending sync notification to X user(s)...
✅ Email sent to user1@example.com
✅ Email sent to user2@example.com
📧 Sync notification sent: 2/2 emails delivered
```

## Désactivation des emails

Si vous ne voulez pas configurer les emails :
- Laissez `EMAIL_USER` et `EMAIL_PASSWORD` vides
- Le système continuera de fonctionner normalement
- Les logs afficheront : "Email notification skipped (service not configured)"

## Dépannage

### Erreur : "Invalid login"
- Vérifiez que vous utilisez un mot de passe d'application (pas votre mot de passe Gmail normal)
- Vérifiez que l'authentification à deux facteurs est activée

### Erreur : "Connection timeout"
- Vérifiez `EMAIL_PORT` (587 pour TLS, 465 pour SSL)
- Vérifiez `EMAIL_SECURE` (false pour 587, true pour 465)
- Vérifiez que votre pare-feu autorise les connexions SMTP sortantes

### Erreur : "Recipient rejected"
- Vérifiez que les emails des utilisateurs dans MongoDB sont valides
- Vérifiez les limites d'envoi de votre fournisseur (Gmail : 500/jour)

### Les emails arrivent dans les spams
- Configurez SPF, DKIM et DMARC pour votre domaine (en production)
- Utilisez un service professionnel (SendGrid, Mailgun, AWS SES) pour la production

## Production

Pour la production, il est **fortement recommandé** d'utiliser un service d'email professionnel :

1. **SendGrid** (12 000 emails/mois gratuits)
2. **Mailgun** (5 000 emails/mois gratuits)
3. **AWS SES** (62 000 emails/mois gratuits avec AWS Free Tier)
4. **Postmark** (100 emails/mois gratuits)

Ces services offrent :
- ✅ Meilleure délivrabilité
- ✅ Pas de limites strictes
- ✅ Analytics et tracking
- ✅ Support des templates
- ✅ Moins de chances d'aller dans les spams

## Personnalisation

Le template email est défini dans `services/emailService.js`, méthode `generateSyncEmailHTML()`.

Vous pouvez personnaliser :
- Les couleurs du gradient
- Le contenu du message
- Les statistiques affichées
- Le style CSS
