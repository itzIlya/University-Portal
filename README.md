[Untitled 24daae254df08047aebcf7beec5dd36e.md](https://github.com/user-attachments/files/21736380/Untitled.24daae254df08047aebcf7beec5dd36e.md)
# Untitled

# **Setup Guide**

## Run the Backend and Database

To run the Django application and the database, you will need to have Docker Engine on your device.

Clone the project repository and  switch to the main branch. Once in the main branch, build an image using the *Dockerfile* in the project directory and name it whatever you want but remember the name you use for the image because you’re going to have to edit the `docker-compose.ym`l file.

Once the image is built, go to the `docker-compose.yml` file and put your image name in the app service:

```jsx
<SNIP>
      timeout: 5s
      retries: 5

  app:
    image: <your_image_name> # <----- Enter your image name here
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DJANGO_SECRET: ${DJANGO_SECRET}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_HOST: db
<SNIP>
```

Then, create a `.env` file with the following format and replace the values with the ones you’re going to use. 

### .env :

```jsx
# --- MySQL container creds ---
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=university
MYSQL_USER=uniapp
MYSQL_PASSWORD=uniapp

# --- Django settings ---
DJANGO_SECRET=change-me
DB_NAME=${MYSQL_DATABASE}
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_HOST=127.0.0.1          # outside Docker, we still connect to localhost
DB_PORT=3306

```

Finally, run the containers using the below command:

```jsx
docker compose --env-file .env up -d 
```

**Congrats! The backend and database should be up and running.** 

---

## Run the Frontend

## **0. Download the Project**

Click on the link below:  

[**GitHub – DB Project (keinaz branch](https://github.com/itzIlya/DB-project/tree/keinaz))**

Download the **ZIP file** of the repository on branch **`keinaz`** (this branch contains the frontend React project).

Extract the ZIP to your desired location.

---

## **1. Install Node.js**

Install **Node.js 18+** for your OS from nodejs.org.

---

## **2. Install Dependencies**

In the project folder, run:

```bash
npm install
```

This installs all required packages (React, Vite, Tailwind, MUI, Axios, Framer Motion, etc.) from `package.json`.

---

## **3. Backend Connection**

The frontend proxies API calls to Django (default **port 8000**) via `vite.config.js`:

```jsx

proxy: {
  "/api": {
    target: "http://localhost:8000",
    changeOrigin: true,
    secure: false,
  },
}

```

If your backend is running on another host/port, update the `target` value.

---

## **4. CSRF Trusted Origins**

In Django `settings.py`, ensure your frontend port is included:

```jsx

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5186",
    "http://localhost:5187",
    "http://localhost:5188",
    "http://localhost:5189",
]
```

If you use a different port (e.g., `5175`), add it here.

---

## **5. Run the Frontend**

```jsx
npm run dev
```

- Default URL: [http://localhost:5173](http://localhost:5173/)
- This URL must be in `CSRF_TRUSTED_ORIGINS` on the backend.

**Now you have the project running!**
