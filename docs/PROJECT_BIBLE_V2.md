# AI Food Recommendation Platform V2

> Project Bible for AI Agents (Claude Code, Codex, Cursor)

# Vision

Build a production-ready AI-powered food recommendation platform that
helps users discover what to eat using Machine Learning, OpenStreetMap,
restaurant data, and user behavior.

------------------------------------------------------------------------

# Goals

-   Responsive Desktop / Tablet / Mobile
-   AI Recommendation Engine
-   OpenStreetMap (Leaflet, Overpass, Nominatim) — free, no API keys
-   Machine Learning
-   Favorites
-   History
-   Learning From User
-   Admin Dashboard
-   GitHub Pages Frontend
-   Render Backend
-   Production-ready architecture

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   HTML5
-   CSS3
-   TypeScript
-   Vite
-   Tailwind CSS
-   Framer Motion

## Backend

-   Node.js
-   Express

## Database

-   PostgreSQL (Supabase) or MySQL

## AI

-   Python
-   scikit-learn
-   RandomForestRegressor
-   TensorFlow.js (optional browser inference)

## Maps

-   Leaflet (map rendering)
-   Overpass API (real restaurant data from OpenStreetMap)
-   Nominatim (geocoding / address autocomplete)

All free and keyless — no Google Maps, no billing account, no API keys.

------------------------------------------------------------------------

# Core Features

## AI Recommendation

Inputs: - Food type - Budget - Distance - Current time - Open now -
Restaurant tags (delivery/parking/outdoor seating/wheelchair) - Previous
user history - Favorite categories - Weather (optional)

Output: - Recommendation Score (0-100)

Workflow: User -\> API -\> AI Model -\> Ranking -\> Top 10 -\> Weighted
Random -\> UI

------------------------------------------------------------------------

## Map (Leaflet + OpenStreetMap)

Requirements

-   Current location
-   Dark mode
-   Zoom / pan (smooth)
-   Custom markers
-   Marker clustering
-   Route navigation
-   Restaurant popup
-   AI score color

Marker Colors

Green = Highly Recommended Yellow = Recommended Red = Low Match

------------------------------------------------------------------------

# Pages

1.  Home
2.  Search
3.  Recommendation
4.  Restaurant Detail
5.  Favorites
6.  History
7.  Profile
8.  Admin Dashboard
9.  Dataset Manager
10. AI Training

------------------------------------------------------------------------

# Desktop Layout

Header Sidebar Filters Map Recommendation Card Restaurant List

------------------------------------------------------------------------

# Mobile Layout

Header Search Horizontal Filters Recommendation Card Map Bottom
Navigation

------------------------------------------------------------------------

# Database

restaurants menus restaurant_menu users favorites history ratings
training_dataset

------------------------------------------------------------------------

# API

GET /restaurants GET /restaurants/:id POST /recommend POST /favorite GET
/history POST /feedback POST /train GET /model/status

------------------------------------------------------------------------

# Machine Learning

Algorithm

Random Forest Regressor

Training

Dataset CSV ↓

Feature Engineering ↓

Train ↓

Validation ↓

Export model.pkl ↓

Backend Prediction

Future: - XGBoost - LightGBM

------------------------------------------------------------------------

# Learning From User

Every recommendation stores:

-   Selected restaurant
-   Ignored restaurant
-   Favorite
-   Rating
-   Timestamp

Nightly retraining updates the recommendation model.

------------------------------------------------------------------------

# Folder Structure

food-ai/

docs/ client/ server/ database/ model/ scripts/ public/ assets/ tests/

------------------------------------------------------------------------

# Development Phases

Phase 1 - Responsive UI - Map (Leaflet/OSM) - Restaurant cards

Phase 2 - Backend - Database - REST API

Phase 3 - AI Recommendation - Prediction API

Phase 4 - Favorites - History - Learning

Phase 5 - Admin Dashboard - Dataset Manager - Deployment

------------------------------------------------------------------------

# Deployment

Frontend - GitHub Pages

Backend - Render

Database - Supabase

AI - Python Service

------------------------------------------------------------------------

# Coding Standards

-   TypeScript Strict
-   Reusable Components
-   Accessibility (WCAG)
-   Mobile-first
-   Lazy Loading
-   Code Splitting

------------------------------------------------------------------------

# AI Agent Rules

Always:

-   Build responsive first.
-   Reuse components.
-   Never duplicate code.
-   Use semantic HTML.
-   Prefer TypeScript.
-   Document every API.
-   Write tests for business logic.

------------------------------------------------------------------------

# Roadmap

V2 - Complete MVP

V3 - Deep Learning - Voice Search - OCR Menu Scan - Multi-language -
Restaurant Analytics - PWA - Offline Mode
