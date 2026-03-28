# 1. Functional Requirements

These requirements define the specific behaviors and services the system must provide.

## Definite (Must-Have)

**FR-1: Image-Based Identification:**  
The system shall identify a Pokémon card (Name, Set, Number) via a smartphone camera scan or image upload with at least 90% accuracy for English cards.  

**FR-2: Real-Time Valuation:**  
Upon identification, the system shall fetch current market pricing (Market Price, Low, High) using integrated APIs (e.g., TCGPlayer or eBay).  

**FR-3: Personal Collection (Inventory):**  
Users shall be able to add identified cards to a digital “Collection,” with the ability to edit conditions (Near Mint, Lightly Played, etc.) and delete entries.  

**FR-4: Searchable Library:**  
Users shall be able to search a text-based database of all Pokémon cards to view details and base-level pricing without a physical scan.  

**FR-5: User Authentication:**  
The system shall provide secure Login/Sign-up functionality to persist collection data across sessions.  

## Perhaps (Should-Have)

**FR-6: Visual Reasoning (Red-Flagging):**  
The AI shall provide a visual overlay or bulleted list explaining why a card was flagged as a proxy (e.g., “Holographic pattern is static”).  

**FR-7: Price Trending:**  
The “Memory Bank” shall display a historical price chart for cards in the user’s collection based on data captured during previous scans.  

**FR-8: Basic Proxy Detection:**  
The system shall analyze uploaded images for common counterfeit indicators, specifically font irregularities and incorrect expansion symbols.  

## Improbable (Nice-to-Have)

**FR-9: Bulk Scan Mode:**  
The ability to scan and identify multiple cards in a single camera frame for rapid inventorying.  

**FR-10: Admin Overrides:**  
An admin interface to reset user passwords and manually flag “bad data” in the global library.  


# 2. Non-Functional Requirements

These requirements define the quality attributes and constraints of the system.

## Definite (Must-Have)

**NFR-1: Performance (Speed):**  
The “Instant Appraisal” (Identification + Pricing) must return results within 5 seconds under standard 4G/5G/Wi-Fi conditions.  

**NFR-2: Usability:**  
The mobile interface must follow a “Camera-First” design, allowing a user to initiate a scan within one tap of opening the webapp.  

**NFR-3: Reliability:**  
The system shall utilize a cloud-based database to ensure collection data is not lost if the user uninstalls the app.  

## Perhaps (Should-Have)

**NFR-4: Scalability:**  
The backend must be able to handle at least 25 concurrent users performing image analysis without a degradation in response time.  

## Improbable (Nice-to-Have)

**NFR-5: Security:**  
Administrative access (Alice Admin) must require Multi-Factor Authentication (MFA) to prevent unauthorized access to the user database.  


# 3. Interfaces

This section describes how the user and other systems interact with the application.

## Definite (Must-Have)

**I-1: Mobile GUI:**  
A clean, high-contrast interface designed for “one-handed” use. Key screens include the Viewfinder (Camera), Dashboard (Collection), and Market Details.  

**I-2: Camera Integration:**  
The app must interface directly with the mobile device’s hardware camera API to control focus and flash for high-detail texture shots.  

**I-3: External Pricing APIs:**  
The system must interface with at least one major TCG pricing API via RESTful calls to retrieve “Sold” and “List” price data.  

## Improbable (Nice-to-Have)

**I-4: Direct Marketplace Integration:**  
An API interface that allows Sally Seller to “Push to eBay,” pre-filling a listing with the card’s name, set, and AI-identified condition.  