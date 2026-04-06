import { useState } from 'react'
import * as xlsx from 'xlsx'
import { UploadCloud, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'
import { api } from '../../lib/apiClient'

export default function BulkUploadModal({ open, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successCount, setSuccessCount] = useState(null)

  if (!open) return null

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setError(null)
    setSuccessCount(null)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel or CSV file.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = xlsx.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = xlsx.utils.sheet_to_json(worksheet)

      if (!rows || rows.length === 0) {
        throw new Error('File is empty or could not be parsed.')
      }

      // Bulk upload to API (mocking a bulk endpoint or sending sequentially)
      let count = 0
      for (const row of rows) {
        // Assume mapping: Name -> name, Phone -> phone, etc.
        const payload = {
          name: row.Name || row.name || null,
          phone: row.Phone || row.phone || null,
          email: row.Email || row.email || null,
          platform: 'excel_import',
          lead_source: 'bulk',
          notes: row.Notes || row.notes || null
        }
        
        // We simulate calling api.post multiple times if no bulk api exists
        if (payload.phone || payload.email) {
          try {
            await api.post('/api/leads', payload)
            count++
          } catch(e) {
            console.error('Row failed', row)
          }
        }
      }

      setSuccessCount(count)
      if (onUploadSuccess) onUploadSuccess()
    } catch (err) {
      setError(err.message || 'Error parsing file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={onClose} />
       <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 bg-dark-50">
            <h3 className="font-heading font-semibold text-lg text-dark-900">Bulk Upload Leads</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-dark-200 text-dark-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            {!successCount ? (
              <>
                <div className="border-2 border-dashed border-dark-200 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors group cursor-pointer relative">
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <UploadCloud className="w-10 h-10 mx-auto text-dark-400 group-hover:text-primary-500 mb-3" />
                  <p className="text-sm font-medium text-dark-800">
                    {file ? file.name : "Click or drag file to upload here"}
                  </p>
                  <p className="text-xs text-dark-500 mt-1">Supports EXCEL, CSV files</p>
                </div>

                {error && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="secondary" onClick={onClose}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={loading || !file}>
                    {loading ? 'Uploading...' : 'Upload Data'}
                  </Button>
                </div>
              </>
            ) : (
               <div className="text-center py-6">
                 <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                 <h4 className="text-xl font-bold text-dark-900 mb-2">Upload Complete</h4>
                 <p className="text-dark-600 mb-6">Successfully imported {successCount} leads into the CRM.</p>
                 <Button onClick={onClose} className="w-full">Done</Button>
               </div>
            )}
          </div>
       </div>
    </div>
  )
}
