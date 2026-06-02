/**
 * OCR — Tesseract.js integration
 */
import { createWorker } from 'tesseract.js'

export async function recognizeText(image: string | File | Blob, languages: string = 'heb+eng'): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker(languages)
  const result = await worker.recognize(image)
  const text = result.data.text
  const confidence = result.data.confidence
  await worker.terminate()
  return { text, confidence }
}

export async function extractDocument(image: string | File | Blob): Promise<{ fullText: string; paragraphs: string[]; confidence: number; language: string }> {
  const result = await recognizeText(image, 'heb+eng+deu+pol')
  const paragraphs = result.text.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean)
  const hebrewChars = (result.text.match(/[\u0590-\u05FF]/g) || []).length
  const totalChars = result.text.replace(/\s/g, '').length
  const language = totalChars > 0 && hebrewChars / totalChars > 0.3 ? 'hebrew' : 'latin'
  return { fullText: result.text, paragraphs, confidence: result.confidence, language }
}
