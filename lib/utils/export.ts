/**
 * Export — html2canvas + jsPDF integration
 * 
 * Export pages, trees, profiles as PDF or PNG.
 */
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/** Capture a DOM element as a PNG image */
export async function captureAsPng(
  element: HTMLElement,
  filename: string = 'export.png'
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0d0702',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        // Trigger download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        resolve(blob)
      }
    }, 'image/png')
  })
}

/** Export a DOM element as PDF */
export async function captureAsPdf(
  element: HTMLElement,
  filename: string = 'export.pdf',
  options?: { orientation?: 'portrait' | 'landscape'; title?: string }
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0d0702',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const orientation = options?.orientation || 'portrait'
  const pdf = new jsPDF(orientation, 'mm', 'a4')

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
  const width = imgWidth * ratio
  const height = imgHeight * ratio
  const x = (pdfWidth - width) / 2

  if (options?.title) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text(options.title, pdfWidth / 2, 15, { align: 'center' })
    pdf.addImage(imgData, 'PNG', x, 25, width, height - 25)
  } else {
    pdf.addImage(imgData, 'PNG', x, 0, width, height)
  }

  pdf.save(filename)
}

/** Export family tree as a shareable image */
export async function exportTree(
  treeElement: HTMLElement,
  familyName: string
): Promise<void> {
  await captureAsPng(
    treeElement,
    `עץ_משפחת_${familyName}.png`
  )
}

/** Generate a share link (creates a data URL for small content) */
export async function generateShareImage(
  element: HTMLElement
): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0d0702',
    scale: 1,
    useCORS: true,
    logging: false,
  })
  return canvas.toDataURL('image/png')
}
