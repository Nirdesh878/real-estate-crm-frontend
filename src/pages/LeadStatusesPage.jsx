import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Drawer from '../components/Drawer'
import Navbar from '../components/Navbar'
import { api } from '../lib/apiClient'
import { debounce } from '../lib/debounce'
import { getLaravelErrorMessage } from '../lib/laravelErrors'
import { leadStatusSchema } from '../lib/validation/schemas'

export default function LeadStatusesPage() {
  const [loading, setLoading] = useState(true)
  const [globalError, setGlobalError] = useState('')
  const [items, setItems] = useState([])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('edit') // edit | create
  const [selectedId, setSelectedId] = useState(null)
  const [drawerStatus, setDrawerStatus] = useState('idle') // idle|saving|saved|error|creating
  const [drawerError, setDrawerError] = useState('')

  const drawerModeRef = useRef(drawerMode)
  const selectedIdRef = useRef(selectedId)
  const drawerStatusRef = useRef(drawerStatus)
  const ignoreWatchRef = useRef(false)
  const saveDebouncedRef = useRef(null)
  const createDebouncedRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(leadStatusSchema),
    defaultValues: { key: '', label: '', sort: 0, is_active: true },
    mode: 'onChange',
  })

  const safeReset = useCallback(
    (values) => {
      ignoreWatchRef.current = true
      form.reset(values)
      Promise.resolve().then(() => {
        ignoreWatchRef.current = false
      })
    },
    [form],
  )

  useEffect(() => {
    drawerModeRef.current = drawerMode
  }, [drawerMode])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    drawerStatusRef.current = drawerStatus
  }, [drawerStatus])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setGlobalError('')
        const { data } = await api.get('/api/lead-statuses')
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setGlobalError(getLaravelErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => (a.sort - b.sort) || (a.id - b.id))
  }, [items])

  function openCreate() {
    setDrawerMode('create')
    setSelectedId(null)
    setDrawerError('')
    setDrawerStatus('idle')
    safeReset({ key: '', label: '', sort: 0, is_active: true })
    setDrawerOpen(true)
  }

  function openEdit(s) {
    setDrawerMode('edit')
    setSelectedId(s.id)
    setDrawerError('')
    setDrawerStatus('idle')
    safeReset({
      key: s.key ?? '',
      label: s.label ?? '',
      sort: Number(s.sort ?? 0),
      is_active: Boolean(s.is_active),
    })
    setDrawerOpen(true)
  }

  async function onDelete(s) {
    const ok = window.confirm(`Delete status "${s.label}" (${s.key})?`)
    if (!ok) return

    setGlobalError('')
    try {
      await api.delete(`/api/lead-statuses/${s.id}`)
      setItems((prev) => prev.filter((x) => x.id !== s.id))
      if (selectedIdRef.current === s.id) setDrawerOpen(false)
    } catch (err) {
      setGlobalError(getLaravelErrorMessage(err))
    }
  }

  useEffect(() => {
    saveDebouncedRef.current = debounce(async () => {
      if (drawerModeRef.current !== 'edit' || !selectedIdRef.current) return
      const id = selectedIdRef.current

      const parsed = leadStatusSchema.safeParse(form.getValues())
      if (!parsed.success) return

      setDrawerStatus('saving')
      setDrawerError('')

      try {
        const payload = {
          key: parsed.data.key,
          label: parsed.data.label,
          sort: Number(parsed.data.sort ?? 0),
          is_active: Boolean(parsed.data.is_active ?? true),
        }
        const { data } = await api.put(`/api/lead-statuses/${id}`, payload)
        setItems((prev) => prev.map((x) => (x.id === id ? data : x)))
        safeReset({
          key: data.key ?? '',
          label: data.label ?? '',
          sort: Number(data.sort ?? 0),
          is_active: Boolean(data.is_active),
        })
        setDrawerStatus('saved')
        setTimeout(() => setDrawerStatus('idle'), 1000)
      } catch (err) {
        setDrawerError(getLaravelErrorMessage(err))
        setDrawerStatus('error')
      }
    }, 650)

    return () => saveDebouncedRef.current?.cancel?.()
  }, [form, safeReset])

  useEffect(() => {
    createDebouncedRef.current = debounce(async () => {
      if (drawerModeRef.current !== 'create') return
      if (drawerStatusRef.current === 'creating') return

      const parsed = leadStatusSchema.safeParse(form.getValues())
      if (!parsed.success) return

      setDrawerStatus('creating')
      setDrawerError('')

      try {
        const payload = {
          key: parsed.data.key,
          label: parsed.data.label,
          sort: Number(parsed.data.sort ?? 0),
          is_active: Boolean(parsed.data.is_active ?? true),
        }
        const { data } = await api.post('/api/lead-statuses', payload)
        setItems((prev) => [...prev, data])
        setDrawerMode('edit')
        setSelectedId(data.id)
        safeReset({
          key: data.key ?? '',
          label: data.label ?? '',
          sort: Number(data.sort ?? 0),
          is_active: Boolean(data.is_active),
        })
        setDrawerStatus('saved')
        setTimeout(() => setDrawerStatus('idle'), 1000)
      } catch (err) {
        setDrawerError(getLaravelErrorMessage(err))
        setDrawerStatus('error')
      }
    }, 700)

    return () => createDebouncedRef.current?.cancel?.()
  }, [form, safeReset])

  useEffect(() => {
    if (!drawerOpen) return
    const sub = form.watch(() => {
      if (ignoreWatchRef.current) return
      if (drawerModeRef.current === 'edit') saveDebouncedRef.current?.()
      if (drawerModeRef.current === 'create') createDebouncedRef.current?.()
    })
    return () => sub.unsubscribe()
  }, [drawerOpen, form])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Lead Statuses
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Configure status options for leads.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add status
            </button>
          </div>

          {globalError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {globalError}
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 py-3 pr-4">Key</th>
                  <th className="border-b border-slate-200 py-3 pr-4">
                    Label
                  </th>
                  <th className="border-b border-slate-200 py-3 pr-4">Sort</th>
                  <th className="border-b border-slate-200 py-3 pr-4">
                    Active
                  </th>
                  <th className="border-b border-slate-200 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-sm text-slate-600"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : null}

                {sorted.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => openEdit(s)}
                  >
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {s.key}
                    </td>
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {s.label}
                    </td>
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {s.sort}
                    </td>
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {s.is_active ? 'Yes' : 'No'}
                    </td>
                    <td className="border-b border-slate-100 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(s)
                        }}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-sm text-slate-500"
                    >
                      No statuses found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Drawer
        open={drawerOpen}
        title={
          drawerMode === 'create'
            ? 'New status'
            : selectedId
              ? `Status #${selectedId}`
              : 'Status'
        }
        onClose={() => setDrawerOpen(false)}
      >
        {drawerError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {drawerError}
          </div>
        ) : null}

        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {drawerStatus === 'creating'
            ? 'Creating...'
            : drawerStatus === 'saving'
              ? 'Saving...'
              : drawerStatus === 'saved'
                ? 'Saved'
                : drawerStatus === 'error'
                  ? 'Error'
                  : ''}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Key
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
              placeholder="new"
              {...form.register('key')}
            />
            {form.formState.errors.key?.message ? (
              <p className="mt-1 text-xs text-rose-700">
                {form.formState.errors.key.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Lowercase letters/numbers/underscores only.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Label
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
              placeholder="New"
              {...form.register('label')}
            />
            {form.formState.errors.label?.message ? (
              <p className="mt-1 text-xs text-rose-700">
                {form.formState.errors.label.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Sort
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
              type="number"
              min="0"
              {...form.register('sort', {
                setValueAs: (v) => (v === '' || v === null ? 0 : Number(v)),
              })}
            />
            {form.formState.errors.sort?.message ? (
              <p className="mt-1 text-xs text-rose-700">
                {form.formState.errors.sort.message}
              </p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              {...form.register('is_active', {
                setValueAs: (v) => Boolean(v),
              })}
            />
            Active
          </label>

          {drawerMode === 'create' ? (
            <p className="text-xs text-slate-500">
              Tip: Fill key + label to auto-create the status.
            </p>
          ) : null}
        </div>
      </Drawer>
    </div>
  )
}

