import * as XLSX from 'xlsx'

/**
 * Parses an uploaded Excel or CSV file.
 * @param {File} file - The file object from input or drag-and-drop.
 * @returns {Promise<{ headers: string[], rows: any[][], rowCount: number, previewRows: any[][] }>}
 */
export async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [], rowCount: 0, previewRows: [] })
          return
        }

        const headers = jsonData[0].map((h) => (h ? String(h).trim() : ''))
        const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== null && cell !== ''))
        const previewRows = rows.slice(0, 5)

        resolve({
          headers,
          rows,
          rowCount: rows.length,
          previewRows,
        })
      } catch (err) {
        reject(new Error('Failed to parse file: ' + err.message))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Converts rows + headers into an array of objects.
 */
export function rowsToObjects(headers, rows) {
  return rows.map((row) => {
    const obj = {}
    headers.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined ? row[idx] : ''
    })
    return obj
  })
}
