# 📱 Service de Notifications WhatsApp Automatiques (Algérie 🇩🇿)

Ce microservice écoute en temps réel les changements de statut des commandes dans la base de données **Cloud Firestore** (`food-delivery-prod-b474f`) et expédie instantanément des notifications WhatsApp automatiques aux clients et cuisiniers.

---

## ⚡ 2 Options de Fournisseur Disponibles

| Caractéristique | 🟢 Option 1 : Meta WhatsApp Cloud API | 🟣 Option 2 : Twilio WhatsApp Sandbox |
| :--- | :--- | :--- |
| **Type** | Officiel Meta / Facebook | Passerelle API tierce |
| **Coût** | **1 000 conversations de service gratuites par mois** | Crédit gratuit de test (~15$) |
| **Mise en place** | Nécessite un compte Meta Developers | Prêt en **2 minutes chrono** sans vérification |
| **Numéro utilisé** | Votre propre numéro d'entreprise ou numéro de test Meta | Numéro partagé Sandbox Twilio |

---

## 🟢 OPTION 1 : Configuration Meta for Developers (Recommandée)

### Étape 1 : Créer votre Application Meta
1. Rendez-vous sur [developers.facebook.com](https://developers.facebook.com) et connectez-vous avec votre compte Facebook.
2. Cliquez en haut à droite sur **Mes Apps** puis sur le bouton vert **Créer une application**.
3. Choisissez le cas d'usage : **Autre** -> puis sélectionnez le type **Business**.
4. Donnez un nom à votre application (ex: `Food Delivery DZ`).

### Étape 2 : Activer le produit WhatsApp
1. Dans le tableau de bord de votre app, faites défiler vers le bas jusqu'au produit **WhatsApp** et cliquez sur **Configurer**.
2. Dans le menu de gauche, rendez-vous sous **WhatsApp > Démarrage rapide (ou Configuration de l'API)**.

### Étape 3 : Récupérer les clés et tester
Sur cette page, Meta vous fournit directement :
- **Jeton d'accès temporaire (Temporary Access Token)** (commence par `EAAG...`)
- **ID du numéro de téléphone (Phone Number ID)** (suite de 15 chiffres, ex: `108923456789012`)
- **ID de compte WhatsApp Business (WABA ID)**

Sous la section **"Étape 1 : Sélectionner des numéros de téléphone"** :
1. Dans le champ **"À" (To)**, ajoutez votre propre numéro de téléphone algérien (ex: `+213 555 12 34 56`).
2. Meta vous enverra un SMS ou message WhatsApp avec un code de vérification à 6 chiffres.
3. Une fois vérifié, vous pouvez envoyer des messages de test !

---

## 🟣 OPTION 2 : Configuration Twilio WhatsApp (Test Ultra Rapide)

Si vous voulez tester tout de suite sans créer d'application Meta Business :
1. Créez un compte gratuit sur [twilio.com](https://www.twilio.com).
2. Rendez-vous dans la console Twilio : **Messaging > Try WhatsApp**.
3. Envoyez le message indiqué (ex: `join sweet-apple`) depuis votre téléphone au numéro WhatsApp de Twilio (`+1 415 523 8886`).
4. Récupérez sur votre tableau de bord :
   - `TWILIO_ACCOUNT_SID` (ex: `AC...`)
   - `TWILIO_AUTH_TOKEN` (ex: `3f...`)

---

## ⚙️ Installation & Démarrage du Microservice

### 1. Cloner ou naviguer dans le dossier
```bash
cd whatsapp-service
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Créer votre fichier `.env`
Copiez le modèle `.env.example` vers `.env` :
```bash
copy .env.example .env
```
Ouvrez `.env` et collez vos identifiants (Meta ou Twilio).

### 4. Tester l'envoi vers votre téléphone en 1 commande
```bash
node test-whatsapp.js 0555123456
```
*(Remplacez `0555123456` par votre vrai numéro de téléphone algérien)*

Si vous recevez le message sur votre téléphone, **félicitations ! Le canal WhatsApp fonctionne.** 🎉

### 5. Démarrer le service d'écoute en temps réel
```bash
npm start
```
Le service écoute désormais la collection `orders` dans Firestore. Dès qu'une commande passe à :
- `WAITING_CLIENT_CONFIRMATION` : Le client reçoit la proposition d'heure du chef.
- `IN_PREPARATION` : Le cuisinier est notifié que le client a validé et que la cuisson commence.
- `READY_FOR_PICKUP` : Le client est prévenu que les plats sont emballés.
- `ASSIGNED_TO_DELIVERY` : Le client reçoit le prénom du livreur en route.
- `DELIVERED` : Le client reçoit un message de bon appétit et le lien de notation.

---

## ☁️ Déploiement en Production 24h/24

Vous pouvez laisser tourner ce microservice gratuitement 24h/24 :
1. **Sur Render.com (Gratuit) :**
   - Créez un "Web Service" ou "Background Worker" connecté à votre dépôt GitHub.
   - Root Directory : `whatsapp-service`
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Ajoutez vos variables d'environnement dans l'onglet "Environment".
2. **Sur Windows en arrière-plan :**
   - Vous pouvez installer `pm2` (`npm install -g pm2`) puis exécuter `pm2 start index.js --name "whatsapp-service"`.

