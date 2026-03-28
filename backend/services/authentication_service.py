"""
Domain service placeholder for card authentication and proxy detection.

Scope:
- FR-1 Image-Based Identification orchestration (camera pipeline + AI model invocation)
- FR-6 Visual Reasoning output formatting (accent test, spelling test, holographic cues)
- FR-8 Basic Proxy Detection heuristics
- Cal Collector + Sally Seller persona needs for trustworthy scans

Integration Notes:
- Consumes raw scan artifacts from scan_routes.
- Will invoke ML inference, feature extraction, and metadata normalization once models land.
"""

from ..models.scan_result_model import AuthenticityReport, AuthenticitySignal


async def analyze_authenticity(image_bytes: bytes) -> AuthenticityReport:
    """Return a deterministic proxy-check result for the current mock workflow."""

    byte_count = len(image_bytes)
    checksum = sum(image_bytes[:128]) % 100 if image_bytes else 0

    signals = [
        AuthenticitySignal(
            name="Font Test",
            passed=byte_count % 3 != 0,
            detail="Lettering appears consistent with official card print runs.",
        ),
        AuthenticitySignal(
            name="Accent Test",
            passed=checksum % 5 != 0,
            detail="No obvious missing accent or typographic substitution detected.",
        ),
        AuthenticitySignal(
            name="Holo Test",
            passed=byte_count % 7 != 0,
            detail="Surface pattern does not obviously resemble flat proxy holo foil.",
        ),
        AuthenticitySignal(
            name="Spelling Test",
            passed=True,
            detail="No OCR-backed spelling validation is wired in yet for the mock flow.",
        ),
    ]
    failed_count = sum(1 for signal in signals if not signal.passed)
    is_authentic_guess = failed_count < 2
    confidence = 0.88 if failed_count == 0 else 0.72 if failed_count == 1 else 0.38
    summary = (
        "No major proxy indicators were detected in the mock appraisal."
        if is_authentic_guess
        else "Multiple proxy indicators were triggered in the mock appraisal."
    )

    return AuthenticityReport(
        is_authentic_guess=is_authentic_guess,
        confidence=confidence,
        summary=summary,
        signals=signals,
    )
