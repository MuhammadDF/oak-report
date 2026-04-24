"""Scan orchestration for the first appraisal vertical slice."""

from datetime import datetime, timezone
import os
from google import genai
from google.genai import types
import json
from dotenv import load_dotenv

from ..models.card_model import CardIdentity
from ..models.scan_result_model import ScanResultModel
from .pricing_service import get_card_info


async def identify_card_from_image(image_bytes: bytes) -> ScanResultModel:
    """Analyze an uploaded image and return an appraisal payload."""

    load_dotenv()
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite-preview",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg"
            ),
            "Identify the card in this image and return a json object with the following fields: name of the cardtranslated into English, card number, and language fully spelled out (ex: English, Japanese, etc). The name should not have a hyphen unless it is a ho-oh. The json object should be the only content in your response."],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CardIdentity,
            temperature=0.0,
            thinking_config={
                "thinking_budget": 0, # No extra 'thoughts' needed for OCR
                "include_thoughts": False
            }
        )
    )

    print("RESPONSE" + response.text)
    data = json.loads(response.text)
    raw_card_number = data.get("card_number") or data.get("card number")
    parsed_card_number = raw_card_number.split("/")[0].strip() if raw_card_number else None

    card = CardIdentity(
        name=data.get("name", "Unknown Card"),
        card_number=parsed_card_number,
        language=data.get("language"),
    )
    pricing, console_name, image_url = await get_card_info(card)
    print("API RESPONSE", pricing, console_name, image_url)

    return ScanResultModel(
        processed_at=datetime.now(timezone.utc),
        card=card,
        pricing=pricing,
        image_url=image_url,
        set_name=console_name or data.get("set") or data.get("set_name")
    )
