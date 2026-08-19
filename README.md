# MaraGo MVP

MaraGo is a Mararaba-focused bike-ride and dispatch service. This repository contains its public website, clickable browser prototypes, API starter, and React Native mobile app starters.

## What is here

- `index.html` — public marketing website
- `app.html` and `rider.html` — browser prototypes for customer and rider flows
- `backend/` — runnable starter API for users and trip requests
- `apps/customer/` — Expo/React Native customer app starter
- `apps/rider/` — Expo/React Native rider app starter

## Run the API

```bash
npm run start:api
```

The health check is at `http://localhost:4000/health`. Run `npm --workspace backend test` to check the customer/trip flow.

## Start the mobile apps

The current Expo toolchain requires Node.js `20.19.4` or newer. After upgrading Node and running `npm install`, run one command in a separate terminal:

```bash
npm run dev:customer
npm run dev:rider
```

Use Expo Go on an Android or iPhone to scan the QR code and test each app. Do not push `.env` files, map credentials, payment keys, or real customer data to GitHub.

## Deploy the website demo on Vercel

The Vercel deployment is for the public website and browser demos only. It will publish `index.html`, `app.html`, and `rider.html`; the API and native mobile apps need separate hosting/build steps later.

1. Create a new GitHub repository and push this folder to it.
2. In Vercel, choose **Add New → Project**, import that repository, select the repository root as the **Root Directory**, and click **Deploy**. No build command is needed for this static demo.
3. Share the generated Vercel URL. Customer and rider demos are available at `/app` and `/rider`.
