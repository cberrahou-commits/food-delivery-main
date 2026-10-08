# 🚀 Guide Complet de Déploiement : Food Delivery App

Ce projet est composé de 3 applications connectées au même backend Firebase :
1. **Restaurant Dashboard** (Application Web Next.js 13 & Tailwind CSS)
2. **User App** (Application Mobile Client Expo / React Native)
3. **Driver App** (Application Mobile Livreur Expo / React Native)
4. **Backend Cloud** (Firebase Authentication & Cloud Firestore)

---

## 📋 Table des Matières
- [1. Configuration du Backend Firebase](#1-configuration-du-backend-firebase)
- [2. Déploiement du Dashboard Restaurant (Web)](#2-déploiement-du-dashboard-restaurant-web)
  - [Option A : Déploiement sur Vercel (Recommandé - Gratuit & 1 Clic)](#option-a--déploiement-sur-vercel-recommandé)
  - [Option B : Déploiement via Docker](#option-b--déploiement-via-docker)
  - [Option C : Déploiement sur Firebase Hosting](#option-c--déploiement-sur-firebase-hosting)
- [3. Déploiement des Applications Mobiles (Client & Livreur)](#3-déploiement-des-applications-mobiles)
  - [Générer les fichiers APK Android (Installation directe)](#générer-les-fichiers-apk-android-test-immédiat)
  - [Déploiement sur Google Play Store & Apple App Store](#déploiement-sur-les-stores)
- [4. Vérification et Résolution des Problèmes Fréquents](#4-vérification-et-résolution-des-problèmes)

---

## 1. Configuration du Backend Firebase

### A. Créer le projet Firebase
1. Rendez-vous sur la [Console Firebase](https://console.firebase.google.com/) et créez un nouveau projet (ex: `mon-food-delivery`).
2. Activez **Authentication** :
   - Allez dans *Authentication* > *Sign-in method*.
   - Activez le fournisseur **Email/Mot de passe** et **Google**.
3. Activez **Cloud Firestore** :
   - Allez dans *Firestore Database* > *Créer une base de données*.
   - Choisissez un emplacement (ex: `europe-west1` ou `us-central1`).
4. Créez une application Web dans Firebase :
   - Cliquez sur l'icône Web `</>` pour obtenir vos identifiants Firebase (`apiKey`, `projectId`, etc.).

### B. Déployer les Règles de Sécurité et les Index Firestore
Les fichiers [`firestore.rules`](./firestore.rules) et [`firestore.indexes.json`](./firestore.indexes.json) sont déjà configurés à la racine du projet.

Pour les déployer directement depuis votre terminal :
```bash
# Se connecter à Firebase
npx firebase-tools login

# Associer votre projet Firebase
npx firebase-tools use --add

# Déployer les règles et index
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

---

## 2. Déploiement du Dashboard Restaurant (Web)

### Option A : Déploiement sur Vercel (Recommandé)
Vercel est la plateforme officielle et la plus rapide pour déployer Next.js.

1. **Via GitHub / Interface Vercel :**
   - Poussez votre code sur GitHub/GitLab.
   - Rendez-vous sur [Vercel](https://vercel.com/) et cliquez sur **Add New Project**.
   - Sélectionnez le dossier racine `restaurant-dashboard`.
   - Dans la section **Environment Variables**, ajoutez :
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `NEXT_PUBLIC_RESTAURANT_ID` (l'identifiant Firestore de votre restaurant)
   - Cliquez sur **Deploy**.

2. **Via la ligne de commande (CLI) :**
   ```bash
   cd restaurant-dashboard
   npx vercel
   # Suivez les instructions à l'écran
   npx vercel --prod
   ```

### Option B : Déploiement via Docker
Un `Dockerfile` optimisé multi-stage et un fichier `docker-compose.yml` sont inclus.

Pour lancer le dashboard sur n'importe quel VPS (Ubuntu, Debian, etc.) ou serveur local :
```bash
# À la racine du projet
docker compose up -d --build
```
Le dashboard sera accessible sur `http://votre-ip:3000`.

### Option C : Déploiement sur Firebase Hosting
```bash
cd restaurant-dashboard
npm run build
cd ..
npx firebase-tools deploy --only hosting
```

---

## 3. Déploiement des Applications Mobiles

Les deux applications (`user-side` et `driver-app`) utilisent **Expo** et sont configurées avec **EAS (Expo Application Services)**.

### A. Prérequis Expo
1. Créez un compte gratuit sur [Expo](https://expo.dev/).
2. Installez le CLI EAS :
   ```bash
   npm install -g eas-cli
   eas login
   ```

---

### B. Application Utilisateur (`user-side`)

#### 1. Tester en direct avec Expo Go
```bash
cd user-side
npm install
npx expo start
```
Scannez le QR code avec l'application mobile Expo Go (Android/iOS).

#### 2. Générer l'APK Android (Installation directe sur téléphone)
Le profil `preview` dans `eas.json` permet de générer un fichier `.apk` autonome téléchargeable :
```bash
cd user-side
eas build -p android --profile preview
```
Une fois le build terminé (dans le Cloud Expo), un lien de téléchargement direct de l'APK vous est fourni.

#### 3. Préparer pour le Google Play Store (AAB)
```bash
cd user-side
eas build -p android --profile production
```

#### 4. Préparer pour l'Apple App Store (iOS)
*(Nécessite un compte Apple Developer)*
```bash
cd user-side
eas build -p ios --profile production
```

---

### C. Application Livreur (`driver-app`)

#### 1. Configuration de l'API Google Maps
L'application coursier utilise Google Maps Directions pour le guidage GPS et le calcul d'itinéraire.
- Obtenez une clé API sur Google Cloud Console avec les APIs :
  - *Maps SDK for Android*
  - *Maps SDK for iOS*
  - *Directions API*
- Définissez la clé dans `driver-app/.env` :
  ```env
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=VOTRE_CLE_GOOGLE_MAPS
  ```

#### 2. Générer l'APK Livreur
```bash
cd driver-app
eas build -p android --profile preview
```

---

## 4. Vérification et Résolution des Problèmes

1. **Erreur Firestore "Missing or insufficient permissions" :**
   - Assurez-vous d'avoir déployé les règles [`firestore.rules`](./firestore.rules) ou que l'utilisateur est bien connecté.
2. **Erreur d'index Firestore (The query requires an index) :**
   - Déployez les index via `npx firebase-tools deploy --only firestore:indexes` ou cliquez sur le lien généré dans la console pour créer l'index composite manquant en 1 clic.
3. **Changer le restaurant du Dashboard :**
   - Changez simplement la variable `NEXT_PUBLIC_RESTAURANT_ID` dans `restaurant-dashboard/.env.local` ou dans les variables d'environnement de votre hébergeur (Vercel/Docker).

