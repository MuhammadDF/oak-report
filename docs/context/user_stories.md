# 1. User Personas

## Cal Collector

● Role: An individual focused on building, maintaining, and protecting a personal Pokémon TCG collection.  

● Primary Goals:  
○ Verify the authenticity of cards to avoid purchasing "proxies" or counterfeits.  
○ Track the current market value of cards already in their possession.  
○ Maintain a digital inventory of their physical collection.  

● Needs:  
○ Fast, "low-friction" authentication via a smartphone camera.  
○ A searchable library for general Pokémon card research.  
○ A "Memory Bank" to view historical scan data and value trends.  

● Pain Points:  
○ Difficulty identifying high-quality fakes (e.g., incorrect fonts or flat holographic patterns).  
○ Manual effort required to look up prices across multiple platforms like eBay and TCGPlayer.  
○ The challenge of keeping a collection inventory up-to-date as market prices shift.  

## Sally Seller

● Role: A user focused on leveraging the app’s data to accurately price cards for the secondary market.  

● Primary Goals:  
○ Obtain real-time, grounded pricing data to ensure competitive and fair listings.  
○ Monitor market shifts to time the sale of specific cards.  
○ Quickly authenticate inventory before listing it for sale to maintain seller reputation.  

● Needs:  
○ Live web grounding for price accuracy across multiple sources (Pricecharting, eBay, Google Shopping).  
○ Clear visual reasoning from the AI explaining why a card is flagged as a proxy.  
○ Efficient "Instant Appraisal" to process multiple cards quickly.  

● Pain Points:  
○ Static price charts that do not reflect "sold" data or sudden market spikes.  
○ Risk of financial loss due to accidentally selling a high-value counterfeit.  
○ Time-consuming manual research for pricing across different card conditions and sets.  

## Alice Admin (Tentative)

● Role: Administrative or Root User with master-level system-wide access.  

● Primary Goals:  
○ Oversee and manage all user accounts within the system.  
○ Modify or restrict access to specific features and functions for other users.  
○ Facilitate account recovery and maintenance.  

● Needs:  
○ A centralized administrative dashboard to view and control user data.  
○ Administrative tools to perform "overrides" on user settings or permissions.  
○ A direct mechanism for triggered password resets.  

● Pain Points:  
○ Manual overhead associated with troubleshooting user access issues.  
○ Lack of visibility into how individual users (Cal and Sally) are utilizing specific system functions.  

# 2. User Stories

## For Cal Collector

● Authentication: As a Cal Collector, I want to perform a "Proxy Check" on a card’s font and holographic texture, so that I can be confident I am not purchasing a fake card.  

● Valuation: As a Cal Collector, I want to point my camera at a card and receive an instant dollar value, so that I can understand the worth of my collection without manual research.  

● Collection Management: As a Cal Collector, I want to add, edit, and delete scanned cards in my personal "collection," so that I have a persistent digital record of my assets.  

● Library Research: As a Cal Collector, I want to search a general library for any Pokémon card, so that I can find information on cards I do not yet own or have not scanned.  

● Historical Trends: As a Cal Collector, I want to see previous scans of the same card in my "Memory Bank," so that I can see how its value has changed over time.  

## For Sally Seller

● Live Pricing: As a Sally Seller, I want the app to use live web grounding (eBay/TCGPlayer), so that I can price my cards based on real-time market shifts rather than static data.  

● Detailed Reasoning: As a Sally Seller, I want to see the specific "red flags" (like the "Accent Test" or "Spelling Test") the AI found, so that I can explain to potential buyers why a card was flagged as suspicious.  

● Market Comparison: As a Sally Seller, I want the agent to search multiple pricing APIs simultaneously, so that I can identify the best platform on which to list a specific card for sale.  

## For Alice Admin (Tentative)

● Account Recovery: As an Alice Admin, I want to reset passwords for other users, so that I can resolve login issues and help them regain access to their collections.  

● Feature Management: As an Alice Admin, I want to enable or disable specific features and functions for different users, so that I can manage system-wide access and control the scope of the MVP.  

● User Oversight: As an Alice Admin, I want to have master control over all user-related data, so that I can ensure system integrity and provide support when users encounter errors in their "Memory Bank" or collection.