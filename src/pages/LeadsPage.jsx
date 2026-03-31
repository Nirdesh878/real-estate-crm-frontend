import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Drawer from '../components/Drawer'
import Navbar from '../components/Navbar'
import { api } from '../lib/apiClient'
import { debounce } from '../lib/debounce'
import { getLaravelErrorMessage } from '../lib/laravelErrors'
import { ROLE_CALLER } from '../lib/roles'
import { leadSchema } from '../lib/validation/schemas'

const trackingFields = [
  ['platform', 'Platform'],
  ['lead_source', 'Lead source'],
  ['campaign_name', 'Campaign name'],
  ['ad_set_name', 'Ad set name'],
  ['ad_name', 'Ad name'],
  ['lead_form_name', 'Lead form name'],
  ['source_url', 'Source URL'],
  ['utm_source', 'UTM source'],
  ['utm_medium', 'UTM medium'],
  ['utm_campaign', 'UTM campaign'],
  ['utm_content', 'UTM content'],
  ['utm_term', 'UTM term'],
]

function toNullIfEmpty(v) {
  const s = String(v ?? '').trim()
  return s.length ? v : null
}

export default function LeadsPage() {
  const [loading, setLoading] = useState(true)
  const [globalError, setGlobalError] = useState('')
  const [leads, setLeads] = useState([])
  const [q, setQ] = useState('')
  const [users, setUsers] = useState([])
  const [statuses, setStatuses] = useState([])

  const leadsRef = useRef(leads)
  const drawerModeRef = useRef('edit')
  const selectedIdRef = useRef(null)
  const drawerStatusRef = useRef('idle')
  const ignoreWatchRef = useRef(false)
  const saveDebouncedRef = useRef(null)
  const createDebouncedRef = useRef(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('edit') // edit | create
  const [selectedId, setSelectedId] = useState(null)
  const [drawerStatus, setDrawerStatus] = useState('idle') // idle|saving|saved|creating|error
  const [drawerError, setDrawerError] = useState('')

  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      status: 'new',
      assigned_user_id: null,
      follow_up_at: '',
      notes: '',
      name: '',
      phone: '',
      email: '',
      city: '',
      budget: '',
      plot_size: '',
      purpose: '',
      timeline_to_buy: '',
      loan_required: '',
      platform: '',
      lead_source: '',
      campaign_name: '',
      ad_set_name: '',
      ad_name: '',
      lead_form_name: '',
      source_url: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    },
    mode: 'onChange',
  })

  const safeReset = useCallback((values) => {
    ignoreWatchRef.current = true
    form.reset(values)
    Promise.resolve().then(() => {
      ignoreWatchRef.current = false
    })
  }, [form])

  useEffect(() => {
    leadsRef.current = leads
  }, [leads])

  useEffect(() => {
    drawerModeRef.current = drawerMode
  }, [drawerMode])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    drawerStatusRef.current = drawerStatus
  }, [drawerStatus])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return leads
    return leads.filter((l) => {
      return (
        String(l.name ?? '').toLowerCase().includes(s) ||
        String(l.phone ?? '').toLowerCase().includes(s) ||
        String(l.email ?? '').toLowerCase().includes(s) ||
        String(l.city ?? '').toLowerCase().includes(s) ||
        String(l.campaign_name ?? '').toLowerCase().includes(s)
      )
    })
  }, [leads, q])

  const statusesSorted = useMemo(() => {
    return [...statuses].sort((a, b) => (a.sort - b.sort) || (a.id - b.id))
  }, [statuses])

  const statusLabelByKey = useMemo(() => {
    const map = new Map()
    for (const s of statuses) map.set(String(s.key), String(s.label ?? s.key))
    return map
  }, [statuses])

  const defaultStatusKey = useMemo(() => {
    const firstActive = statusesSorted.find((s) => Boolean(s.is_active))
    return String(firstActive?.key ?? 'new')
  }, [statusesSorted])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setGlobalError('')
        const [leadsRes, usersRes, statusesRes] = await Promise.all([
          api.get('/api/leads'),
          api.get('/api/users'),
          api.get('/api/lead-statuses'),
        ])
        if (!cancelled) {
          setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : [])
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
          setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : [])
        }
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

  const callerOptions = useMemo(() => {
    return users
      .filter((u) => Number(u.role_id) === ROLE_CALLER)
      .map((u) => ({ value: String(u.id), label: `${u.name} (${u.email})` }))
  }, [users])

  function openCreate() {
    setDrawerMode('create')
    setSelectedId(null)
    setDrawerError('')
    setDrawerStatus('idle')
    safeReset({
      status: defaultStatusKey,
      assigned_user_id: null,
      follow_up_at: '',
      notes: '',
      name: '',
      phone: '',
      email: '',
      city: '',
      budget: '',
      plot_size: '',
      purpose: '',
      timeline_to_buy: '',
      loan_required: '',
      platform: 'manual',
      lead_source: 'manual',
      campaign_name: '',
      ad_set_name: '',
      ad_name: '',
      lead_form_name: '',
      source_url: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    })
    setDrawerOpen(true)
  }

  async function openEdit(l) {
    setDrawerMode('edit')
    setSelectedId(l.id)
    setDrawerError('')
    setDrawerStatus('idle')
    setDrawerOpen(true)

    try {
      const { data } = await api.get(`/api/leads/${l.id}`)
      safeReset({
        status: data?.status ?? 'new',
        assigned_user_id: data?.assigned_user_id ?? null,
        follow_up_at: data?.follow_up_at ? String(data.follow_up_at).slice(0, 16) : '',
        notes: data?.notes ?? '',
        name: data?.name ?? '',
        phone: data?.phone ?? '',
        email: data?.email ?? '',
        city: data?.city ?? '',
        budget: data?.budget ?? '',
        plot_size: data?.plot_size ?? '',
        purpose: data?.purpose ?? '',
        timeline_to_buy: data?.timeline_to_buy ?? '',
        loan_required:
          data?.loan_required === null || data?.loan_required === undefined
            ? ''
            : data.loan_required
              ? 'yes'
              : 'no',
        platform: data?.platform ?? '',
        lead_source: data?.lead_source ?? '',
        campaign_name: data?.campaign_name ?? '',
        ad_set_name: data?.ad_set_name ?? '',
        ad_name: data?.ad_name ?? '',
        lead_form_name: data?.lead_form_name ?? '',
        source_url: data?.source_url ?? '',
        utm_source: data?.utm_source ?? '',
        utm_medium: data?.utm_medium ?? '',
        utm_campaign: data?.utm_campaign ?? '',
        utm_content: data?.utm_content ?? '',
        utm_term: data?.utm_term ?? '',
      })
    } catch (err) {
      setDrawerError(getLaravelErrorMessage(err))
      setDrawerStatus('error')
    }
  }

  useEffect(() => {
    saveDebouncedRef.current = debounce(async () => {
      if (drawerModeRef.current !== 'edit' || !selectedIdRef.current) return
      const id = selectedIdRef.current

      const parsed = leadSchema.safeParse(form.getValues())
      if (!parsed.success) return

      setDrawerStatus('saving')
      setDrawerError('')

      try {
        const d = parsed.data
        const payload = {
          status: d.status || 'new',
          assigned_user_id: d.assigned_user_id ?? null,
          follow_up_at: toNullIfEmpty(d.follow_up_at),
          notes: toNullIfEmpty(d.notes),
          name: toNullIfEmpty(d.name),
          phone: toNullIfEmpty(d.phone),
          email: toNullIfEmpty(d.email),
          city: toNullIfEmpty(d.city),
          budget: toNullIfEmpty(d.budget),
          plot_size: toNullIfEmpty(d.plot_size),
          purpose: toNullIfEmpty(d.purpose),
          timeline_to_buy: toNullIfEmpty(d.timeline_to_buy),
          loan_required:
            d.loan_required === ''
              ? null
              : d.loan_required === 'yes',
          platform: toNullIfEmpty(d.platform),
          lead_source: toNullIfEmpty(d.lead_source),
          campaign_name: toNullIfEmpty(d.campaign_name),
          ad_set_name: toNullIfEmpty(d.ad_set_name),
          ad_name: toNullIfEmpty(d.ad_name),
          lead_form_name: toNullIfEmpty(d.lead_form_name),
          source_url: toNullIfEmpty(d.source_url),
          utm_source: toNullIfEmpty(d.utm_source),
          utm_medium: toNullIfEmpty(d.utm_medium),
          utm_campaign: toNullIfEmpty(d.utm_campaign),
          utm_content: toNullIfEmpty(d.utm_content),
          utm_term: toNullIfEmpty(d.utm_term),
        }

        const { data } = await api.put(`/api/leads/${id}`, payload)
        setLeads((prev) => prev.map((x) => (x.id === id ? data : x)))
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

      const parsed = leadSchema.safeParse(form.getValues())
      if (!parsed.success) return

      setDrawerStatus('creating')
      setDrawerError('')

      try {
        const d = parsed.data
        const payload = {
          status: d.status || 'new',
          assigned_user_id: d.assigned_user_id ?? null,
          follow_up_at: toNullIfEmpty(d.follow_up_at),
          notes: toNullIfEmpty(d.notes),
          name: toNullIfEmpty(d.name),
          phone: toNullIfEmpty(d.phone),
          email: toNullIfEmpty(d.email),
          city: toNullIfEmpty(d.city),
          budget: toNullIfEmpty(d.budget),
          plot_size: toNullIfEmpty(d.plot_size),
          purpose: toNullIfEmpty(d.purpose),
          timeline_to_buy: toNullIfEmpty(d.timeline_to_buy),
          loan_required:
            d.loan_required === ''
              ? null
              : d.loan_required === 'yes',
          platform: d.platform || 'manual',
          lead_source: d.lead_source || 'manual',
          campaign_name: toNullIfEmpty(d.campaign_name),
          ad_set_name: toNullIfEmpty(d.ad_set_name),
          ad_name: toNullIfEmpty(d.ad_name),
          lead_form_name: toNullIfEmpty(d.lead_form_name),
          source_url: toNullIfEmpty(d.source_url),
          utm_source: toNullIfEmpty(d.utm_source),
          utm_medium: toNullIfEmpty(d.utm_medium),
          utm_campaign: toNullIfEmpty(d.utm_campaign),
          utm_content: toNullIfEmpty(d.utm_content),
          utm_term: toNullIfEmpty(d.utm_term),
        }

        const { data } = await api.post('/api/leads', payload)
        setLeads((prev) => [data, ...prev])
        const current = form.getValues()
        setDrawerMode('edit')
        setSelectedId(data.id)
        safeReset(current)
        setDrawerStatus('saved')
        setTimeout(() => setDrawerStatus('idle'), 1000)
      } catch (err) {
        setDrawerError(getLaravelErrorMessage(err))
        setDrawerStatus('error')
      }
    }, 750)

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

      <main className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Leads</h2>
              <p className="mt-1 text-sm text-slate-600">
                Captured from Meta lead forms and landing pages.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add lead
            </button>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Search
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name / phone / email / city / campaign"
                className="mt-1 w-80 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
              />
            </div>
          </div>

          {globalError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {globalError}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 text-sm text-slate-600">Loading...</div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 py-3 pr-4">ID</th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Platform
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Status
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Name
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Phone
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Email
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      City
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Budget
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Assigned
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Campaign
                    </th>
                    <th className="border-b border-slate-200 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => openEdit(l)}
                    >
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.id}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.platform || '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.status
                          ? statusLabelByKey.get(String(l.status)) ?? l.status
                          : '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.name || '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.phone || '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.email || '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.city || '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.budget ?? '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.assignee?.name ?? '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {l.campaign_name || '-'}
                      </td>
                      <td className="border-b border-slate-100 py-3">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : ''}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        No leads found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Drawer
        open={drawerOpen}
        title={
          drawerMode === 'create'
            ? 'New lead'
            : selectedId
              ? `Lead #${selectedId}`
              : 'Lead'
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('status')}
              >
                {statusesSorted.length
                  ? statusesSorted.map((s) => (
                      <option
                        key={s.key}
                        value={String(s.key)}
                        disabled={!s.is_active}
                      >
                        {s.label}
                        {!s.is_active ? ' (Inactive)' : ''}
                      </option>
                    ))
                  : ['new', 'contacted', 'qualified', 'unqualified', 'closed'].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Assigned caller
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('assigned_user_id', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              >
                <option value="">Unassigned</option>
                {callerOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Follow up at
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
              type="datetime-local"
              {...form.register('follow_up_at', {
                setValueAs: (v) => (v ? String(v).slice(0, 16) : ''),
              })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('name')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('phone')}
              />
              {form.formState.errors.phone?.message ? (
                <p className="mt-1 text-xs text-rose-700">
                  {form.formState.errors.phone.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                type="email"
                {...form.register('email')}
              />
              {form.formState.errors.email?.message ? (
                <p className="mt-1 text-xs text-rose-700">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                City
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('city')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Budget
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('budget')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Plot size
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('plot_size')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Purpose
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('purpose')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Timeline to buy
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('timeline_to_buy')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Loan required
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('loan_required')}
              >
                <option value="">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
              {...form.register('notes')}
            />
          </div>

          {drawerMode === 'create' ? (
            <p className="text-xs text-slate-500">
              Tip: Enter phone or email to auto-create the lead.
            </p>
          ) : null}

          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-900">
              Tracking fields
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {trackingFields.map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700">
                    {label}
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                    {...form.register(key)}
                  />
                  {key === 'source_url' &&
                  form.formState.errors.source_url?.message ? (
                    <p className="mt-1 text-xs text-rose-700">
                      {form.formState.errors.source_url.message}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        </div>
      </Drawer>
    </div>
  )
}
