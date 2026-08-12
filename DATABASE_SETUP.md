# 🚀 Firebase & Firestore Database Setup Guide for Beginners

This step-by-step guide will walk you from zero (creating a Google/Firebase account) to having a fully functional cloud database and authentication setup for your **Pregnancy Care Tracker** project.

---

## 📌 Overview of the Architecture
Your project uses an **Offline-First Hybrid Architecture**:
1. **Local Storage (`AsyncStorage`)**: Stores health logs, emergency contacts, and reminders instantly on the user's phone (works offline).
2. **Cloud Database (Firebase Firestore)**: Syncs local data to the cloud when online so users can access their health data across devices and share emergency details with family companions.
3. **Authentication (Firebase Auth)**: Manages secure user login (Google Sign-In / Demo Mode).

---

## 🛠️ Step 1: Create a Google & Firebase Account
1. Open your web browser and go to the **[Firebase Console](https://console.firebase.google.com/)**.
2. Sign in with your **Google Account** (Gmail).
3. If this is your first time using Firebase, click **Get Started**.

---

## 📁 Step 2: Create a New Firebase Project
1. In the Firebase Console, click **Add project** (or **Create a project**).
2. **Project Name**: Enter a name for your project, e.g., `pregnancy-care-app`.
3. Click **Continue**.
4. **Google Analytics**: You can turn Google Analytics **OFF** (or ON if you want analytics later).
5. Click **Create Project**.
6. Wait 10-15 seconds for Firebase to prepare your environment, then click **Continue**.

---

## 📱 Step 3: Register Your Web / React Native App
1. On your project's main dashboard ("Project Overview"), click the **Web icon** (`</>`) to add Firebase to your React Native / Expo app.
2. **App nickname**: Type `Pregnancy Care Mobile App`.
3. Leave "Firebase Hosting" unchecked for now.
4. Click **Register app**.

---

## 🔑 Step 4: Copy & Configure Your Firebase Credentials
After registering the app, Firebase will display a code snippet containing `const firebaseConfig = { ... }`.

1. Copy the values from your screen:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

2. Open the file [`src/services/firebase.ts`](file:///c:/Users/enter/Desktop/Preganancy%20Tracker/pregnancy-care-app/src/services/firebase.ts) in your project.

3. Replace the placeholder values with your actual Firebase keys:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCNIH8E5wRl3wJNkSvXA9It4WMUo-TQ5KM",
  authDomain: "pregnancy-care-app-781bc.firebaseapp.com",
  projectId: "pregnancy-care-app-781bc",
  storageBucket: "pregnancy-care-app-781bc.firebasestorage.app",
  messagingSenderId: "861526621059",
  appId: "1:861526621059:web:30eaa88232021117f854b6",
  measurementId: "G-TTY92F19Z2"
};
```

---

## 🗄️ Step 5: Enable Cloud Firestore Database
1. In the Firebase Console left-hand sidebar, click **Databases and storage** (on the left menu).
2. Click **Cloud Firestore** (or **Firestore Database**).
3. Click **Create database**.
4. **Database Location**: Select a location closest to your target users (e.g., `asia-south1` for India, or `nam5 (us-central)`).
5. **Security Rules**: Select **Start in test mode** (this allows reading/writing for 30 days while testing).
6. Click **Create**.

---

## 🔒 Step 6: Set Up Firestore Security Rules (Recommended)
To ensure each user can only read and write their own data:

1. Click on the **Rules** tab at the top of the Firestore Database page.
2. Replace the contents with the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Demo mode rule (allows demo testing)
    match /users/{userId}/{document=**} {
      allow read, write: if userId.matches('demo_user_.*');
    }
  }
}
```
3. Click **Publish**.

---

## 🔐 Step 7: Enable Authentication (Google Sign-In & Email)
1. In the left-hand sidebar under **Product categories**, click **Security** (or **Authentication**).
2. Click **Authentication** ➔ **Get Started**.
3. Under the **Sign-in method** tab:
   - Select **Google**, click **Enable**, select your **Project support email**, and click **Save**.
   - *(Optional)* Select **Email/Password**, click **Enable**, and click **Save**.

---

## 🧪 Step 8: Test Database & Cloud Syncing in Your App

1. Run your app using:
   ```bash
   npx expo start
   ```
2. Navigate to **Health Log** or **Emergency Contacts** screen in the app.
3. Save a health record (e.g., Weight: 62kg, BP: 120/80).
4. Data is instantly saved locally in [`storage.ts`](file:///c:/Users/enter/Desktop/Preganancy%20Tracker/pregnancy-care-app/src/services/storage.ts).
5. Open your **Firestore Database Data Tab** in the browser console. You will see collections created under `/users/{userId}/healthLogs`.

---

## 📊 Firestore Database Schema Summary

Here is how your database structures data automatically:

```
users/ (Collection)
 └── {userId}/ (Document)
      ├── healthLogs/ (Sub-collection)
      │    └── {logId} (Document: date, weight, bpSystolic, bpDiastolic, symptoms, mood)
      ├── emergencyContacts/ (Sub-collection)
      │    └── {contactId} (Document: name, phone, relationship, priorityOrder)
      └── checkups/ (Sub-collection)
           └── {checkupId} (Document: date, doctorName, notes, prescribedMeds)
```

---

## ✅ Troubleshoot Common Beginner Errors
- **`FirebaseError: Firebase: Error (auth/invalid-api-key)`**: Ensure you copied the exact `apiKey` from Firebase Console into [`firebase.ts`](file:///c:/Users/enter/Desktop/Preganancy%20Tracker/pregnancy-care-app/src/services/firebase.ts).
- **`Permission Denied`**: Ensure Firestore database is created and security rules allow read/write access.
- **Offline Working**: If internet disconnects, the app uses `AsyncStorage` automatically and syncs via [`firestoreSync.ts`](file:///c:/Users/enter/Desktop/Preganancy%20Tracker/pregnancy-care-app/src/services/firestoreSync.ts) when internet returns.
