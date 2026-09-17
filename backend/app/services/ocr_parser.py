import os
import json
import logging
import fitz  # PyMuPDF
import pdfplumber

logger = logging.getLogger("ocr_parser")

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract or PIL not available. Using native PDF text parser fallback.")

class DocumentParserService:
    @staticmethod
    def extract_text_by_pages(filepath: str) -> list[dict]:
        """
        Extracts text from PDF page by page.
        Returns a list of dicts: [{'page': 1, 'text': '...', 'has_ocr': False}, ...]
        """
        results = []
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        # Attempt extraction using PyMuPDF (fitz) - fast and accurate
        try:
            doc = fitz.open(filepath)
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text").strip()
                
                # Check if page is scanned/empty text and fallback to pytesseract if needed
                is_ocr_used = False
                if len(text) < 30 and TESSERACT_AVAILABLE:
                    try:
                        pix = page.get_pixmap(dpi=150)
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        ocr_text = pytesseract.image_to_string(img).strip()
                        if len(ocr_text) > len(text):
                            text = ocr_text
                            is_ocr_used = True
                    except Exception as ocr_err:
                        logger.warning(f"OCR failed for page {page_num+1}: {ocr_err}")

                results.append({
                    "page": page_num + 1,
                    "text": text,
                    "has_ocr": is_ocr_used
                })
            doc.close()
        except Exception as err:
            logger.error(f"PyMuPDF error reading {filepath}: {err}. Trying pdfplumber fallback...")
            try:
                with pdfplumber.open(filepath) as pdf:
                    for i, page in enumerate(pdf.pages):
                        page_text = page.extract_text() or ""
                        results.append({
                            "page": i + 1,
                            "text": page_text.strip(),
                            "has_ocr": False
                        })
            except Exception as e2:
                logger.error(f"pdfplumber also failed: {e2}")

        return results

    @staticmethod
    def extract_full_document_text(filepath: str) -> str:
        pages = DocumentParserService.extract_text_by_pages(filepath)
        return "\n\n--- PAGE BREAK ---\n\n".join([f"[Page {p['page']}]\n{p['text']}" for p in pages])
