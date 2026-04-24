import { useEffect, useState } from 'react'
import { UploadCloud, X, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import { Button } from '../ui/Button'
import { api } from '../../lib/apiClient'

export default function BulkUploadModal({ open, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successCount, setSuccessCount] = useState(null)
  const [skippedCount, setSkippedCount] = useState(null)
  const [skippedNoContact, setSkippedNoContact] = useState(null)
  const [skippedDuplicate, setSkippedDuplicate] = useState(null)
  const [sheetName, setSheetName] = useState(null)
  const [headerRow, setHeaderRow] = useState(null)
  const [dedupe, setDedupe] = useState(true)
  const [allowMissingContact, setAllowMissingContact] = useState(true)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setLoading(false)
      setError(null)
      setSuccessCount(null)
      setSkippedCount(null)
      setSkippedNoContact(null)
      setSkippedDuplicate(null)
      setSheetName(null)
      setHeaderRow(null)
      setDedupe(true)
      setAllowMissingContact(true)
    }
  }, [open])

  if (!open) return null

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setError(null)
    setSuccessCount(null)
    setSkippedCount(null)
    setSkippedNoContact(null)
    setSkippedDuplicate(null)
    setSheetName(null)
    setHeaderRow(null)
  }

  const handleClose = () => {
    setFile(null)
    setLoading(false)
    setError(null)
    setSuccessCount(null)
    setSkippedCount(null)
    setSkippedNoContact(null)
    setSkippedDuplicate(null)
    setSheetName(null)
    setHeaderRow(null)
    setDedupe(true)
    setAllowMissingContact(true)
    onClose?.()
  }

  const downloadTemplate = async () => {
    setError(null)
    try {
      const res = await api.get('/api/leads/import-template', {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], {
        type:
          res.headers?.['content-type'] ??
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'leads-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Download failed.')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel file (.xlsx).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('dedupe', dedupe ? '1' : '0')
      fd.append('allow_missing_contact', allowMissingContact ? '1' : '0')
      const { data } = await api.post('/api/leads/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const created = Number(data?.created ?? 0)
      const skipped = Number(data?.skipped ?? 0)
      const noContact = Number(data?.skipped_no_contact ?? 0)
      const duplicate = Number(data?.skipped_duplicate ?? 0)
      const errors = Array.isArray(data?.errors) ? data.errors : []

      setSuccessCount(created)
      setSkippedCount(skipped)
      setSkippedNoContact(noContact)
      setSkippedDuplicate(duplicate)
      setSheetName(data?.sheet_name ?? null)
      setHeaderRow(Number.isFinite(Number(data?.header_row)) ? Number(data.header_row) : null)

      if (errors.length) {
        setError(
          `Imported with errors. First error: row ${errors[0]?.row}: ${errors[0]?.message}`,
        )
      }

      if (onUploadSuccess) onUploadSuccess({ created, skipped, noContact, duplicate, errors, sample: data?.sample })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Upload failed.')
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
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-dark-200 text-dark-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            {successCount === null ? (
              <>
                <div className="border-2 border-dashed border-dark-200 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors group cursor-pointer relative">
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <UploadCloud className="w-10 h-10 mx-auto text-dark-400 group-hover:text-primary-500 mb-3" />
                  <p className="text-sm font-medium text-dark-800">
                    {file ? file.name : "Click or drag file to upload here"}
                  </p>
                  <p className="text-xs text-dark-500 mt-1">Supports Excel (.xlsx)</p>
                </div>

                {error && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-dark-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-dark-300"
                      checked={dedupe}
                      onChange={(e) => setDedupe(e.target.checked)}
                    />
                    Skip duplicates (recommended)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-dark-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-dark-300"
                      checked={allowMissingContact}
                      onChange={(e) => setAllowMissingContact(e.target.checked)}
                    />
                    Import rows even if phone/email is blank
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="secondary" icon={Download} onClick={downloadTemplate}>
                    Download sample
                  </Button>
                  <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={loading || !file}>
                    {loading ? 'Uploading...' : 'Upload Data'}
                  </Button>
                </div>
              </>
            ) : (
               <div className="text-center py-6">
                 <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                 <h4 className="text-xl font-bold text-dark-900 mb-2">Upload Complete</h4>
                 <p className="text-dark-600 mb-6">
                   Created {successCount} leads{typeof skippedCount === 'number' ? `, skipped ${skippedCount}` : ''}.
                 </p>
                 {sheetName ? (
                   <div className="mb-4 text-xs text-dark-500">
                     Imported sheet: <span className="font-medium text-dark-700">{sheetName}</span>
                     {typeof headerRow === 'number' ? ` (header row ${headerRow})` : ''}
                   </div>
                 ) : null}
                 {typeof skippedNoContact === 'number' || typeof skippedDuplicate === 'number' ? (
                   <div className="mb-6 text-left text-sm text-dark-700 space-y-1">
                     {typeof skippedNoContact === 'number' ? (
                       <div>Skipped (no phone/email): {skippedNoContact}</div>
                     ) : null}
                     {typeof skippedDuplicate === 'number' ? (
                       <div>Skipped (duplicate): {skippedDuplicate}</div>
                     ) : null}
                   </div>
                 ) : null}
                 <Button onClick={handleClose} className="w-full">Done</Button>
               </div>
            )}
          </div>
       </div>
    </div>
  )
}
