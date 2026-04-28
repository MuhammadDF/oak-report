# Product Specifications

These requirements describe product intent for Oak Report. Some items are implemented today, while others remain roadmap context; see [Architecture](../architecture.md) for current implementation state.

## Functional Requirements

### Must Have

**FR-1: Image-Based Identification**
The system shall identify a Pokemon card by name, set, and number from a smartphone camera scan or image upload with at least 90% accuracy for English cards.

**FR-2: Real-Time Valuation**
After identification, the system shall fetch current market pricing using integrated sources such as PriceCharting, TCGPlayer, or eBay.

**FR-3: Personal Collection**
Users shall be able to add identified cards to a digital collection, edit collection details, and delete entries.

**FR-4: Appraise-Page Search**
Users shall be able to search for Pokemon cards from the appraise page and view pricing/catalog matches. The earlier standalone searchable library concept was scratched.

**FR-5: User Authentication**
The system shall provide secure login and session handling so collection data persists across sessions.

### Should Have

**FR-6: Visual Reasoning**
The AI should explain likely proxy or counterfeit flags, such as font issues, static holographic patterns, or incorrect symbols.

**FR-8: Basic Proxy Detection**
The system should analyze uploaded images for common counterfeit indicators.

### Nice to Have

**FR-9: Bulk Scan Mode**
Users may scan and identify multiple cards in a single camera frame.

**FR-10: Admin Overrides**
Admins may manage access or correct bad pricing/catalog data.

## Non-Functional Requirements

### Must Have

**NFR-1: Performance**
Instant appraisal should return identification and pricing results within 5 seconds under normal mobile or Wi-Fi conditions.

**NFR-2: Usability**
The mobile interface should prioritize low-friction card capture.

**NFR-3: Reliability**
Collection data should persist in a cloud-capable database rather than local-only storage.

### Should Have

**NFR-4: Scalability**
The backend should handle at least 25 concurrent users performing image analysis without material response degradation.

### Nice to Have

**NFR-5: Security**
Administrative access should support stronger controls such as MFA before production use.

## Interfaces

### Must Have

**I-1: Mobile GUI**
The app should provide a clean, high-contrast interface for appraisal, collection, and market details.

**I-2: Camera Integration**
The frontend should support mobile camera capture and image upload workflows.

**I-3: External Pricing APIs**
The backend should integrate with at least one pricing source for market data.

### Nice to Have

**I-4: Direct Marketplace Integration**
The app may eventually prefill marketplace listings with appraised card data.
