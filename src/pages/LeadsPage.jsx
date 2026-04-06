import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Drawer from '../components/Drawer'
import BulkUploadModal from '../components/leads/BulkUploadModal'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Search, Plus, Filter, MessageCircle, MoreVertical, UploadCloud } from 'lucide-react'

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
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

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
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-dark-900">Leads Pool</h2>
          <p className="text-sm font-medium text-dark-500 mt-1">Manage, assign, and track leads from all sources.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search leads..."
              className="pl-9 pr-4 py-2 bg-white border border-dark-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-64 shadow-sm"
            />
          </div>
          <Button variant="secondary" icon={UploadCloud} onClick={() => setBulkUploadOpen(true)}>
            Import CSV
          </Button>
          <Button icon={Plus} onClick={openCreate}>
            Add Lead
          </Button>
        </div>
      </div>

      {globalError && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {globalError}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-dark-50/80 border-b border-dark-200 text-dark-500">
                <tr>
                  <th className="font-semibold px-6 py-4 rounded-tl-xl text-xs uppercase tracking-wider">User</th>
                  <th className="font-semibold px-6 py-4 text-xs uppercase tracking-wider">Status</th>
                  <th className="font-semibold px-6 py-4 text-xs uppercase tracking-wider">Contact</th>
                  <th className="font-semibold px-6 py-4 text-xs uppercase tracking-wider">Source</th>
                  <th className="font-semibold px-6 py-4 text-xs uppercase tracking-wider">Assigned</th>
                  <th className="font-semibold px-6 py-4 rounded-tr-xl text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-medium">Loading leads data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-dark-500 font-medium">
                      No leads found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => {
                    const statusLabel = l.status ? (statusLabelByKey.get(String(l.status)) ?? l.status) : 'New'
                    let badgeVariant = 'default'
                    if (statusLabel.toLowerCase().includes('new')) badgeVariant = 'primary'
                    if (statusLabel.toLowerCase().includes('win') || statusLabel.toLowerCase().includes('closed')) badgeVariant = 'success'
                    if (statusLabel.toLowerCase().includes('lost')) badgeVariant = 'danger'
                    if (statusLabel.toLowerCase().includes('contact')) badgeVariant = 'warning'

                    return (
                      <tr key={l.id} className="hover:bg-dark-50/50 transition-colors group cursor-pointer" onClick={(e) => {
                        // Prevent row click if clicking a button
                        if (e.target.closest('button') || e.target.closest('a')) return;
                        openEdit(l);
                      }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {l.name ? l.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-dark-900">{l.name || 'Unknown User'}</p>
                              <p className="text-xs text-dark-500">{l.city || 'No Location'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={badgeVariant}>{statusLabel}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-dark-700">{l.phone || '-'}</p>
                          <p className="text-xs text-dark-400">{l.email || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-dark-700 capitalize">{l.platform || 'Manual'}</p>
                          <p className="text-xs text-dark-400 truncate max-w-[150px]">{l.campaign_name || l.lead_source}</p>
                        </td>
                        <td className="px-6 py-4 truncate max-w-[120px]">
                           {l.assignee ? (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-100 text-xs font-semibold text-dark-700">
                               <div className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px]">{l.assignee.name[0]}</div>
                               {l.assignee.name}
                             </span>
                           ) : (
                             <span className="text-dark-400 text-xs italic">Unassigned</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {l.phone && (
                               <a 
                                 href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="p-1.5 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                                 title="Message on WhatsApp"
                               >
                                 <MessageCircle className="w-4 h-4" />
                               </a>
                            )}
                            <button className="p-1.5 rounded-md bg-dark-100 text-dark-600 hover:bg-dark-200 transition-colors">
                               <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <BulkUploadModal 
        open={bulkUploadOpen} 
        onClose={() => setBulkUploadOpen(false)} 
        onUploadSuccess={() => {
           // Reload leads implicitly by toggling UI or calling api.get... 
           // We rely on window.location.reload() for a hard refresh for simplicity in this frontend UI mockup
           window.location.reload()
        }}
      />

      <Drawer
        open={drawerOpen}
        title={
          drawerMode === 'create'
            ? 'Add New Lead'
            : selectedId
              ? `Edit Lead #${selectedId}`
              : 'Lead Details'
        }
        onClose={() => setDrawerOpen(false)}
      >
        {drawerError ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
            {drawerError}
          </div>
        ) : null}

        <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest text-dark-400">
          <div className="flex-1 h-px bg-dark-200"></div>
          {drawerStatus === 'creating' && <span className="text-primary-500 animate-pulse">Creating...</span>}
          {drawerStatus === 'saving' && <span className="text-amber-500 animate-pulse">Saving changes...</span>}
          {drawerStatus === 'saved' && <span className="text-emerald-500">All changes saved</span>}
          {drawerStatus === 'error' && <span className="text-rose-500">Save failed</span>}
          {drawerStatus === 'idle' && <span>Fill Details</span>}
          <div className="flex-1 h-px bg-dark-200"></div>
        </div>

        <div className="space-y-5 pb-10">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Lead Status
              </label>
              <select
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm font-medium text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
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
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ),
                    )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Assigned Caller
              </label>
              <select
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm font-medium text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                {...form.register('assigned_user_id', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              >
                <option value="">-- Unassigned --</option>
                {callerOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <h3 className="text-base font-heading font-bold text-dark-900 border-b border-dark-100 pb-2 mb-4 mt-8">Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="col-span-full">
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Full Name
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                placeholder="John Doe"
                {...form.register('name')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Phone Number
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                placeholder="+91 9999999999"
                {...form.register('phone')}
              />
              {form.formState.errors.phone?.message ? (
                <p className="mt-1.5 text-xs text-rose-600 font-medium tracking-wide">
                  {form.formState.errors.phone.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Email Address
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                type="email"
                placeholder="john@example.com"
                {...form.register('email')}
              />
              {form.formState.errors.email?.message ? (
                <p className="mt-1.5 text-xs text-rose-600 font-medium tracking-wide">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                City / Location
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                placeholder="Mumbai, Maharashtra"
                {...form.register('city')}
              />
            </div>
             <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Follow Up Date/Time
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                type="datetime-local"
                {...form.register('follow_up_at', {
                  setValueAs: (v) => (v ? String(v).slice(0, 16) : ''),
                })}
              />
            </div>
          </div>

          <div>
             <h3 className="text-base font-heading font-bold text-dark-900 border-b border-dark-100 pb-2 mb-4 mt-8">Property Preferences</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Budget
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                placeholder="e.g. 50 Lacs - 1 Cr"
                {...form.register('budget')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Plot/Property Size
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                placeholder="e.g. 1000 sqft"
                {...form.register('plot_size')}
              />
            </div>
             <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Purpose
              </label>
              <input
                className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                placeholder="Investment vs Residential"
                {...form.register('purpose')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                 <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Timeline
                </label>
                <input
                  className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                  placeholder="e.g. 3 Months"
                  {...form.register('timeline_to_buy')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                  Loan Required?
                </label>
                <select
                  className="w-full rounded-xl border border-dark-200 bg-dark-50 px-3.5 py-2.5 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm"
                  {...form.register('loan_required')}
                >
                  <option value="">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-base font-heading font-bold text-dark-900 border-b border-dark-100 pb-2 mb-4 mt-8">Internal Notes</h3>
          </div>

          <div>
            <textarea
              className="min-h-32 w-full rounded-xl border border-dark-200 bg-dark-50 px-4 py-3 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition-all shadow-sm placeholder-dark-400"
              placeholder="Add any interaction details, call transcripts, or context here..."
              {...form.register('notes')}
            />
          </div>

          {drawerMode === 'create' && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-xs font-medium text-primary-800 flex items-center gap-2 mt-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
              Tip: Enter phone or email to auto-save and create the lead.
            </div>
          )}

          <details className="rounded-2xl border border-dark-200 bg-dark-50 p-5 mt-6 group">
            <summary className="cursor-pointer text-sm font-bold text-dark-800 uppercase tracking-widest outline-none list-none flex items-center justify-between">
              Advanced Tracking & UTMs
              <div className="w-6 h-6 rounded-full bg-dark-200 flex items-center justify-center group-open:rotate-180 transition-transform">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </summary>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t border-dark-200">
              {trackingFields.map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-dark-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <input
                    className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 outline-none focus:ring-2 focus:ring-primary-500/50"
                    {...form.register(key)}
                  />
                  {key === 'source_url' &&
                  form.formState.errors.source_url?.message ? (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {form.formState.errors.source_url.message}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        </div>
      </Drawer>
    </>
  )
}
