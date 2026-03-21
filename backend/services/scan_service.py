from ..models.card_model import CardModel


async def identify_card_from_image(image_bytes: bytes) -> CardModel:
	"""Analyze an uploaded image and return the normalized card metadata."""
	
	return CardModel(
		id="pending-labelling",
		name="Unknown",
		supertype="Pokémon",
		types=None,
		set_name=None,
		number=None,
		rarity=None,
		is_holo=None,
		is_reverse_holo=None,
		promo=None,
		grade=None,
		grading_company=None,
		current_value=None,
		image_url=None,
	)
