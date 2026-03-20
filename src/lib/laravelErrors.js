export function getLaravelErrorMessage(error) {
  const status = error?.response?.status
  const data = error?.response?.data

  if (status === 422 && data?.errors && typeof data.errors === 'object') {
    const firstFieldErrors = Object.values(data.errors)[0]
    if (Array.isArray(firstFieldErrors) && firstFieldErrors[0]) {
      return String(firstFieldErrors[0])
    }
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

