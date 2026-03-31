import { z } from 'zod'
import { ROLE_CALLER } from '../roles'

export const emailSchema = z.string().trim().email('Enter a valid email')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: emailSchema,
    password: z.string().min(6, 'Min 6 characters'),
    passwordConfirmation: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  })

export function userCreateSchema(roleIds = []) {
  const role = roleIds.length
    ? z.coerce.number().int().refine((v) => roleIds.includes(v), 'Invalid role')
    : z.coerce.number().int()

  return z
    .object({
      name: z.string().trim().min(1, 'Name is required'),
      email: emailSchema,
      role_id: role,
      manager_id: z.coerce.number().int().nullable().optional(),
      password: z.string().min(6, 'Min 6 characters'),
    })
    .refine(
      (v) => (Number(v.role_id) === ROLE_CALLER ? true : v.manager_id == null),
      {
        message: 'Manager can only be set for callers',
        path: ['manager_id'],
      },
    )
}

export function userEditSchema(roleIds = []) {
  const role = roleIds.length
    ? z.coerce.number().int().refine((v) => roleIds.includes(v), 'Invalid role')
    : z.coerce.number().int()

  return z
    .object({
      name: z.string().trim().min(1, 'Name is required'),
      email: emailSchema,
      role_id: role,
      manager_id: z.coerce.number().int().nullable().optional(),
    })
    .refine(
      (v) => (Number(v.role_id) === ROLE_CALLER ? true : v.manager_id == null),
      {
        message: 'Manager can only be set for callers',
        path: ['manager_id'],
      },
    )
}

export const menuSchema = z.object({
  key: z.string().trim().min(1, 'Key is required').max(100),
  label: z.string().trim().min(1, 'Label is required').max(255),
  path: z.string().trim().min(1, 'Path is required').max(255),
  sort: z.coerce.number().int().min(0).max(65535),
})

export const leadStatusSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Key is required')
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, underscores'),
  label: z.string().trim().min(1, 'Label is required').max(255),
  sort: z.coerce.number().int().min(0).max(65535),
  is_active: z.coerce.boolean().optional(),
})

export const leadSchema = z
  .object({
    status: z.string().trim().min(1),
    assigned_user_id: z.coerce.number().int().nullable().optional(),
    follow_up_at: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),

    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z
      .string()
      .trim()
      .email('Enter a valid email')
      .nullable()
      .optional()
      .or(z.literal('')),
    city: z.string().nullable().optional(),

    budget: z.union([z.string(), z.number()]).nullable().optional(),
    plot_size: z.string().nullable().optional(),
    purpose: z.string().nullable().optional(),
    timeline_to_buy: z.string().nullable().optional(),
    loan_required: z.enum(['', 'yes', 'no']).optional(),

    platform: z.string().nullable().optional(),
    lead_source: z.string().nullable().optional(),
    campaign_name: z.string().nullable().optional(),
    ad_set_name: z.string().nullable().optional(),
    ad_name: z.string().nullable().optional(),
    lead_form_name: z.string().nullable().optional(),
    source_url: z.string().url('Enter a valid URL').nullable().optional().or(z.literal('')),
    utm_source: z.string().nullable().optional(),
    utm_medium: z.string().nullable().optional(),
    utm_campaign: z.string().nullable().optional(),
    utm_content: z.string().nullable().optional(),
    utm_term: z.string().nullable().optional(),
  })
  .refine(
    (v) => {
      const phone = String(v.phone ?? '').trim()
      const email = String(v.email ?? '').trim()
      return phone.length > 0 || email.length > 0
    },
    { message: 'Phone or email is required', path: ['phone'] },
  )
