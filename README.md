# 📓 Journal App - Scrapbook Studio

A full-stack journaling application featuring a creative scrapbook experience. Built with **React Native (Expo)** for the frontend and **Node.js/Express** for the backend.

---

## 🚀 Features

-   **Creative Scrapbooking:** Add stickers, quotes, and custom drawings to your journal entries.
-   **Authentication:** Secure login and registration.
-   **Cloud Storage:** Your entries are saved securely in MongoDB.
-   **Security:** Update your private PIN for added journaling privacy.
-   **Interactive UI:** Smooth gestures and modern design for a premium feel.

---

## 🛠️ Tech Stack

### **Frontend**
-   **Framework:** [Expo](https://expo.dev/) (React Native)
-   **Navigation:** React Navigation
-   **State Management:** React Hooks
-   **Storage:** AsyncStorage
-   **Creative Tools:** React Native Gesture Handler, ViewShot, SVG

### **Backend**
-   **Server:** Node.js, Express
-   **Database:** MongoDB Atlas (Mongoose)
-   **Auth:** JSON Web Tokens (JWT)
-   **Deployment:** [Vercel](https://vercel.com/) / [Render](https://render.com/)

---

## 🏁 Getting Started

### **1. Clone the repository**
```bash
git clone https://github.com/Navya-shaji/Journal.git
cd Journal
```

### **2. Setup Backend (Server)**
1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory and add your variables:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_atlas_uri
    JWT_SECRET=your_secret_key
    ```
4.  Start the server:
    ```bash
    npm start
    ```

### **3. Setup Frontend (Mobile)**
1.  Navigate to the `mobile` directory:
    ```bash
    cd ../mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set your environment variable for the API:
    ```bash
    # On Windows (PowerShell)
    $env:EXPO_PUBLIC_API_URL="http://localhost:5000"
    ```
4.  Start the Expo dev server:
    ```bash
    npx expo start
    ```

---

## 🌐 Deployment Instructions

### **Backend (Render)**
-   **Build Command:** `npm install`
-   **Start Command:** `node index.js`
-   **Environment Variables:** Add `MONGODB_URI` and `JWT_SECRET`.

### **Frontend (Render Static Site)**
-   **Root Directory:** `mobile`
-   **Build Command:** `npm install && npx expo export --platform web`
-   **Publish Directory:** `dist`
-   **Environment Variable:** Add `EXPO_PUBLIC_API_URL` pointing to your backend.

---

## 📝 License
This project is for educational purposes. Feel free to use and adapt it!
