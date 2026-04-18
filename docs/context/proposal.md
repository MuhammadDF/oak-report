Pokemon Appraisal App  
Sunday, January 25 · 11:30am – 12:30pm  
Time zone: America/New_York  

Google Meet joining info  
Video call link: https://meet.google.com/rup-toap-ngh  

COMP523 - TCG/Pokemon Appraisal Agent/Web App  

## Executive Summary  

Project Name: PokéAgent Appraiser → Oak Report (Official app name)  

Objective: To create an agentic system designed to authenticate and value Pokémon TCG cards using Google Cloud Platform (GCP). Experience to be a low-friction, mobile-accessible web app & AI agent that enables collectors to instantly determine the market value of Pokémon TCG cards via a smartphone camera.  

Value Proposition: Unlike static price charts, this agent uses live web grounding to account for real-time market shifts and visual reasoning to detect counterfeits, all while running on a cost-effective serverless architecture.  

## Component Service

| Component | Service |
| --- | --- |
| Image Inference | Gemini 3 Flash (Vertex AI) |
| Web Search | Google Search Grounding |
| Orchestration | Vertex AI Agent Builder |
| Hosting | Cloud Run (Serverless) |

## UX - Critical User Journeys (CUJs)  

These are the three "Happy Paths" that define the success of the MVP:  

● CUJ 1: The Instant Appraisal  
* User Action: Opens web app, points camera at a card, and clicks "Appraise."  
○ Agent Action: Extracts card ID, searches Pricecharting,eBay/TCGPlayer, and returns a $ Value.  

● CUJ 2: The Proxy/Fake Guard  
* User Action: Scans a suspected counterfeit card.  
○ Agent Action: Identifies visual red flags (font, holo-pattern, spelling) and alerts the user before displaying a price.  

● CUJ 3: Price Market Tracking  
* User Action: Re-scans a card previously appraised.  
○ Agent Action: Recalls the previous price from the Memory Bank and highlights the value trend.  

● CUJ 4: Batch processing  
* User Action: Opens web ap, points camera at multiple of cards and clicks “Appraise.”  
○ Agent Action: Batch extracts card ID, searches Pricecharting,eBay/TCGPlayer, and returns a $ Value.  

## Tech Stack/Languages  

| Category | Technology |
| --- | --- |
| Frontend | React (Vite) + Tailwind CSS + Typescript |
| Language | Python (Backend), Typescript (Frontend) |

Database: Postgres  

Agent Framework: Google ADK - https://github.com/google/adk-python  

AI Models: Gemini 2./3 Flash  

Compute: GCP Cloud Run Functions (Gen 2)  

Memory: Vertex AI Memory Bank (Postgres-backed)  

Grounding: Google Search Tool  

## High Level Project Plan & Estimated LOE  

| Phase | Tasks | Estimated Time |
| --- | --- | --- |
| Phase 1: Agent Logic | Pydantic schemas, prompt engineering, search grounding setup. | 12 - 16 hours |
| Phase 2: Infrastructure | GCP project setup, IAM roles, deploy Cloud Functions. | 6 - 8 hours |
| Phase 3: Frontend | Camera integration, result UI, mobile responsiveness. | 15 - 20 hours |
| Phase 4: Testing | Proxy/Fake detection tuning, Memory Bank validation. | 10 - 12 hours |

Target MVP Launch

Notes:

APIs:
Pricecharting  
Ebay  
130pt 2tpt2.com  
Tcgplayer  
Google Search/Shopping  

https://gemini.google.com/share/5480eec2cf13  

I Built a Pokémon Card Analytics App That Prints PASSIVE Income w/ AI (step-by-step gu…  

authentication_instruction = """
You are a master TCG Authenticator. Before searching for prices, perform a 'Proxy Check' on the image:

1. THE FONT TEST: Real cards use a very specific, crisp font. If the font is overly thin, rounded, or bold, flag it as 'Incorrect Font'.

2. THE ACCENT TEST: Check every instance of the word 'Pokémon'. If the accent over the 'é' is missing, it is 100% fake.

3. THE HOLO TEST: If the card is a VMAX or Full Art, it should have a fingerprint-like 'texture'. If the image shows a flat, vertical rainbow shine with no texture, flag as 'Flat/Fake Holo'.

4. THE SPELLING TEST: Look for typos in the attack descriptions.

5. THE BACK TEST: If the back of the card is shown, check the blue swirl. Fakes are often 'washed out' or have a purplish tint.

If you find 2+ flags, set is_authentic_guess to False and rate the value as 'Poor' regardless of the price.
"""

Card number / Set number  

Rarities: 4 of them  

Stamp: e.g., best buy exclusive, costco deal, etc.
