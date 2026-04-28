# Oak Report Proposal Context

This document preserves the original project pitch and target product direction. It is background context, not a guarantee that every capability is implemented in the current repo.

## Executive Summary

Oak Report is a Pokemon TCG appraisal web app intended to help collectors identify, authenticate, value, and track cards from a mobile-friendly experience.

The long-term product vision combines:

- Camera or image-upload based card identification.
- Market-aware valuation from external pricing sources.
- Visual reasoning for counterfeit or proxy signals.
- Persistent collection tracking.
- Admin controls for user and data oversight.

## Target Critical User Journeys

### Instant Appraisal

The user opens the app, captures or uploads a card image, and receives normalized card identity plus estimated value.

### Proxy/Fake Guard

The user scans a suspected counterfeit card. The system identifies visual red flags such as font issues, missing accents, incorrect symbols, spelling mistakes, or suspicious holographic texture.

### Market Tracking

The user revisits a previously appraised card and can compare current value with prior collection context.

### Batch Processing

The user captures multiple cards in one workflow and receives appraisals for each card. This remains roadmap scope.

## Target Stack Direction

| Category | Direction |
| --- | --- |
| Frontend | React, Vite, TypeScript |
| Backend | Python, FastAPI |
| Database | Postgres |
| AI | Gemini-oriented visual reasoning |
| Deployment | Google Cloud direction; Cloud Run backend and Firebase Hosting frontend in the current implementation |
| Market data | PriceCharting first, with possible future eBay/TCGPlayer grounding |

## Authentication and Counterfeit Reasoning Context

The original product concept included a TCG authentication prompt that checks for font quality, the accent in "Pokemon", holographic texture, spelling errors, and card-back color/printing issues.

In implementation docs, treat that prompt as product direction. Current scan behavior should be verified from `backend/services/scan_service.py` and current tests before making claims about supported detection quality.
