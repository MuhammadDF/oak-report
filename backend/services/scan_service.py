"""Scan orchestration for the first appraisal vertical slice."""

from datetime import datetime, timezone
import os
from google import genai
from google.genai import types
import json
from dotenv import load_dotenv

from ..models.card_model import CardIdentity
from ..models.scan_result_model import ScanResultModel
from .pricing_service import get_pricing_snapshot


async def identify_card_from_image(image_bytes: bytes) -> ScanResultModel:
    """Analyze an uploaded image and return an appraisal payload."""

    load_dotenv()
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg"
            ),
            "Identify the card in this image and return a json object with the following fields: name, card number, set, language"],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CardIdentity,
        )
    )

    print("RESPONSE" + response.text)
    data = json.loads(response.text)

    card = CardIdentity(
        name=data.get("name", "Unknown Card"),
        card_number=data.get("card_number") or data.get("card number"),
        language=data.get("language"),
    )
    pricing = await get_pricing_snapshot(card)

    return ScanResultModel(
        processed_at=datetime.now(timezone.utc),
        card=card,
        pricing=pricing,
        set_name=data.get("set") or data.get("set_name")
    )
