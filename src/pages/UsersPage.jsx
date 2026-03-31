import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Drawer from '../components/Drawer'
import Navbar from '../components/Navbar'
import { api } from '../lib/apiClient'
import { debounce } from '../lib/debounce'
import { getLaravelErrorMessage } from '../lib/laravelErrors'
import { ROLE_CALLER, ROLE_MANAGER } from '../lib/roles'
import { userCreateSchema, userEditSchema } from '../lib/validation/schemas'

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [globalError, setGlobalError] = useState('')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState('edit') // edit | create
  const [selectedId, setSelectedId] = useState(null)
  const [drawerStatus, setDrawerStatus] = useState('idle') // idle | saving | saved | error | creating
  const [drawerError, setDrawerError] = useState('')

  const usersRef = useRef(users)
  const drawerModeRef = useRef(drawerMode)
  const selectedIdRef = useRef(selectedId)
  const drawerStatusRef = useRef(drawerStatus)
  const ignoreWatchRef = useRef(false)
  const saveDebouncedRef = useRef(null)
  const createDebouncedRef = useRef(null)

  const roleIds = useMemo(() => {
    return roles
      .map((r) => Number(r.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  }, [roles])

  const schema = useMemo(() => {
    return drawerMode === 'create'
      ? userCreateSchema(roleIds)
      : userEditSchema(roleIds)
  }, [drawerMode, roleIds])

  const schemaRef = useRef(schema)
  useEffect(() => {
    schemaRef.current = schema
  }, [schema])

  const resolver = useCallback(async (values, context, options) => {
    const r = zodResolver(schemaRef.current)
    return r(values, context, options)
  }, [])

  const form = useForm({
    resolver,
    defaultValues: {
      name: '',
      email: '',
      role_id: ROLE_CALLER,
      manager_id: null,
      password: '',
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
    usersRef.current = users
  }, [users])

  useEffect(() => {
    drawerModeRef.current = drawerMode
  }, [drawerMode])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    drawerStatusRef.current = drawerStatus
  }, [drawerStatus])

  const roleOptions = useMemo(() => {
    return roles.map((r) => ({ value: String(r.id), label: r.name }))
  }, [roles])

  const managerOptions = useMemo(() => {
    return users
      .filter((u) => Number(u.role_id) === ROLE_MANAGER)
      .map((u) => ({ value: String(u.id), label: `${u.name} (${u.email})` }))
  }, [users])

  const roleId = useWatch({ control: form.control, name: 'role_id' })

  useEffect(() => {
    if (Number(roleId) !== ROLE_CALLER && form.getValues('manager_id') != null) {
      ignoreWatchRef.current = true
      form.setValue('manager_id', null, { shouldDirty: true })
      Promise.resolve().then(() => {
        ignoreWatchRef.current = false
      })
    }
  }, [form, roleId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setGlobalError('')
        const [usersRes, rolesRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/roles'),
        ])
        if (!cancelled) {
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
          setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : [])
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

  function openCreate() {
    setDrawerMode('create')
    setSelectedId(null)
    setDrawerError('')
    setDrawerStatus('idle')
    safeReset({
      name: '',
      email: '',
      role_id: ROLE_CALLER,
      manager_id: null,
      password: '',
    })
    setDrawerOpen(true)
  }

  function openEdit(u) {
    setDrawerMode('edit')
    setSelectedId(u.id)
    setDrawerError('')
    setDrawerStatus('idle')
    safeReset({
      name: u.name ?? '',
      email: u.email ?? '',
      role_id: Number(u.role_id ?? ROLE_CALLER),
      manager_id: u.manager_id ?? null,
      password: '',
    })
    setDrawerOpen(true)
  }

  async function deleteSelected() {
    const userId = selectedIdRef.current
    const current = usersRef.current.find((x) => x.id === userId)
    if (!current) return
    const ok = window.confirm(`Delete user "${current.email}"?`)
    if (!ok) return

    setDrawerError('')
    setDrawerStatus('saving')
    try {
      await api.delete(`/api/users/${userId}`)
      setUsers((prev) => prev.filter((x) => x.id !== userId))
      setDrawerOpen(false)
    } catch (err) {
      setDrawerError(getLaravelErrorMessage(err))
      setDrawerStatus('error')
    }
  }

  async function resetPasswordSelected() {
    const userId = selectedIdRef.current
    const current = usersRef.current.find((x) => x.id === userId)
    if (!current) return
    const p = window.prompt(`Set new password for ${current.email}`)
    if (!p) return

    const parsed = schemaRef.current.safeParse(form.getValues())
    if (!parsed.success) return

    setDrawerError('')
    setDrawerStatus('saving')
    try {
      const payload = {
        name: parsed.data.name,
        email: parsed.data.email,
        role_id: Number(parsed.data.role_id ?? ROLE_CALLER),
        manager_id:
          Number(parsed.data.role_id) === ROLE_CALLER
            ? parsed.data.manager_id ?? null
            : null,
        password: p,
      }
      const { data } = await api.put(`/api/users/${userId}`, payload)
      setUsers((prev) => prev.map((x) => (x.id === userId ? data : x)))
      safeReset({
        name: data.name ?? '',
        email: data.email ?? '',
        role_id: Number(data.role_id ?? ROLE_CALLER),
        manager_id: data.manager_id ?? null,
        password: '',
      })
      setDrawerStatus('saved')
      setTimeout(() => setDrawerStatus('idle'), 1000)
    } catch (err) {
      setDrawerError(getLaravelErrorMessage(err))
      setDrawerStatus('error')
    }
  }

  useEffect(() => {
    saveDebouncedRef.current = debounce(async () => {
      if (drawerModeRef.current !== 'edit' || !selectedIdRef.current) return
      const userId = selectedIdRef.current

      const parsed = schemaRef.current.safeParse(form.getValues())
      if (!parsed.success) return

      setDrawerStatus('saving')
      setDrawerError('')

      try {
        const payload = {
          name: parsed.data.name ?? '',
          email: parsed.data.email ?? '',
          role_id: Number(parsed.data.role_id ?? ROLE_CALLER),
          manager_id:
            Number(parsed.data.role_id) === ROLE_CALLER
              ? parsed.data.manager_id ?? null
              : null,
        }
        const { data } = await api.put(`/api/users/${userId}`, payload)
        setUsers((prev) => prev.map((x) => (x.id === userId ? data : x)))
        safeReset({
          name: data.name ?? '',
          email: data.email ?? '',
          role_id: Number(data.role_id ?? ROLE_CALLER),
          manager_id: data.manager_id ?? null,
          password: '',
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

      const parsed = schemaRef.current.safeParse(form.getValues())
      if (!parsed.success) return

      setDrawerStatus('creating')
      setDrawerError('')

      try {
        const payload = {
          name: parsed.data.name.trim(),
          email: parsed.data.email.trim(),
          password: parsed.data.password,
          role_id: Number(parsed.data.role_id ?? ROLE_CALLER),
          manager_id:
            Number(parsed.data.role_id) === ROLE_CALLER
              ? parsed.data.manager_id ?? null
              : null,
        }
        const { data } = await api.post('/api/users', payload)
        setUsers((prev) => [data, ...prev])
        setDrawerMode('edit')
        setSelectedId(data.id)
        safeReset({
          name: data.name ?? '',
          email: data.email ?? '',
          role_id: Number(data.role_id ?? ROLE_CALLER),
          manager_id: data.manager_id ?? null,
          password: '',
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
              <h2 className="text-lg font-semibold text-slate-900">Users</h2>
              <p className="mt-1 text-sm text-slate-600">Admin-only user list.</p>
            </div>
            <button
              onClick={openCreate}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add user
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
                  <th className="border-b border-slate-200 py-3 pr-4">Name</th>
                  <th className="border-b border-slate-200 py-3 pr-4">Email</th>
                  <th className="border-b border-slate-200 py-3 pr-4">Role</th>
                  <th className="border-b border-slate-200 py-3 pr-4">
                    Manager
                  </th>
                  <th className="border-b border-slate-200 py-3">Created</th>
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

                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => openEdit(u)}
                  >
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {u.name}
                    </td>
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {u.email}
                    </td>
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {u.role?.name ?? u.role_id}
                    </td>
                    <td className="border-b border-slate-100 py-3 pr-4">
                      {u.manager?.name ?? '-'}
                    </td>
                    <td className="border-b border-slate-100 py-3">
                      {u.created_at ? new Date(u.created_at).toLocaleString() : ''}
                    </td>
                  </tr>
                ))}

                {!loading && users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-sm text-slate-500"
                    >
                      No users found.
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
            ? 'New user'
            : selectedId
              ? `User #${selectedId}`
              : 'User'
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
              Name
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
              {...form.register('name')}
            />
            {form.formState.errors.name?.message ? (
              <p className="mt-1 text-xs text-rose-700">
                {form.formState.errors.name.message}
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
              Role
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
              {...form.register('role_id', { setValueAs: (v) => Number(v) })}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {form.formState.errors.role_id?.message ? (
              <p className="mt-1 text-xs text-rose-700">
                {form.formState.errors.role_id.message}
              </p>
            ) : null}
          </div>

          {Number(roleId) === ROLE_CALLER ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Manager
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                {...form.register('manager_id', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              >
                <option value="">Unassigned</option>
                {managerOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.manager_id?.message ? (
                <p className="mt-1 text-xs text-rose-700">
                  {form.formState.errors.manager_id.message}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Caller users can be assigned to a manager.
              </p>
            </div>
          ) : null}

          {drawerMode === 'create' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 focus:ring-2"
                type="password"
                {...form.register('password')}
              />
              {form.formState.errors.password?.message ? (
                <p className="mt-1 text-xs text-rose-700">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Tip: Filling name + email + password will auto-create the user.
              </p>
            </div>
          ) : null}

          {drawerMode === 'edit' ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={resetPasswordSelected}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset password...
              </button>
              <button
                onClick={deleteSelected}
                className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                Delete user
              </button>
            </div>
          ) : null}
        </div>
      </Drawer>
    </div>
  )
}
