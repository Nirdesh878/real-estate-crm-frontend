import { useEffect, useMemo, useRef, useState } from 'react'

import { api } from '../lib/apiClient'
import { debounce } from '../lib/debounce'
import { getLaravelErrorMessage } from '../lib/laravelErrors'
import { useAuth } from '../state/auth/useAuth'

export default function PermissionsPage() {
  const { user, setMenus } = useAuth()
  const [roles, setRoles] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  const itemsRef = useRef(items)
  const saveDebouncedRef = useRef(null)

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: String(r.id), label: r.name })),
    [roles],
  )

  useEffect(() => {
    let cancelled = false

    async function loadRoles() {
      try {
        setLoading(true)
        setError('')
        const { data } = await api.get('/api/roles')
        const list = Array.isArray(data) ? data : []
        if (!cancelled) {
          setRoles(list)
          setSelectedRoleId(list[0] ? String(list[0].id) : '')
        }
      } catch (err) {
        if (!cancelled) setError(getLaravelErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRoles()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedRoleId) return
    let cancelled = false

    async function loadPermissions() {
      try {
        setLoading(true)
        setError('')
        setSaveState('idle')
        const { data } = await api.get(`/api/roles/${selectedRoleId}/permissions`)
        if (!cancelled) {
          const list = Array.isArray(data) ? data : []
          setItems(list)
          if (Number(user?.role_id) === Number(selectedRoleId)) {
            setMenus(
              list
                .filter((p) => p.enabled)
                .map((p) => ({
                  id: p.menu_id,
                  key: p.key,
                  label: p.label,
                  path: p.path,
                  sort: p.sort,
                })),
            )
          }
        }
      } catch (err) {
        if (!cancelled) setError(getLaravelErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPermissions()

    return () => {
      cancelled = true
    }
  }, [selectedRoleId, setMenus, user?.role_id])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    saveDebouncedRef.current = debounce(async () => {
      if (!selectedRoleId) return
      const list = itemsRef.current

      setSaveState('saving')
      setError('')

      try {
        await api.put(`/api/roles/${selectedRoleId}/permissions`, {
          permissions: list.map((p) => ({
            menu_id: p.menu_id,
            enabled: Boolean(p.enabled),
          })),
        })
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 1200)
      } catch (err) {
        setError(getLaravelErrorMessage(err))
        setSaveState('error')
      }
    }, 600)

    return () => {
      saveDebouncedRef.current?.cancel?.()
    }
  }, [selectedRoleId])

  function toggle(menuId) {
    setItems((prev) => {
      const next = prev.map((p) =>
        p.menu_id === menuId ? { ...p, enabled: !p.enabled } : p,
      )

      if (Number(user?.role_id) === Number(selectedRoleId)) {
        setMenus(
          next
            .filter((p) => p.enabled)
            .map((p) => ({
              id: p.menu_id,
              key: p.key,
              label: p.label,
              path: p.path,
              sort: p.sort,
            })),
        )
      }

      return next
    })
    saveDebouncedRef.current?.()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      

      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Permissions
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Enable/disable navbar menus per role.
              </p>
            </div>

            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Role
                </label>
                <select
                  className="mt-1 w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {saveState === 'saving'
                  ? 'Saving…'
                  : saveState === 'saved'
                    ? 'Saved'
                    : saveState === 'error'
                      ? 'Error'
                      : ''}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 text-sm text-slate-600">Loading…</div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Menu
                    </th>
                    <th className="border-b border-slate-200 py-3 pr-4">
                      Path
                    </th>
                    <th className="border-b border-slate-200 py-3">Enabled</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {items.map((p) => (
                    <tr key={p.menu_id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {p.label}
                        <span className="ml-2 text-xs text-slate-400">
                          ({p.key})
                        </span>
                      </td>
                      <td className="border-b border-slate-100 py-3 pr-4">
                        {p.path}
                      </td>
                      <td className="border-b border-slate-100 py-3">
                        <button
                          onClick={() => toggle(p.menu_id)}
                          className={[
                            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                            p.enabled
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-700',
                          ].join(' ')}
                        >
                          {p.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        No menus found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
