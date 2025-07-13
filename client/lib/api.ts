import { useUser } from "@/components/UserContext"

export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  tokens: { access: string; refresh: string } | null,
  refreshToken: () => Promise<boolean>
): Promise<Response> => {
  // Add authorization header if we have tokens
  const headers = {
    ...options.headers,
    ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
  }

  // Make the initial request
  let response = await fetch(url, {
    ...options,
    headers,
  })

  // If we get a 401 and have a refresh token, try to refresh
  if (response.status === 401 && tokens?.refresh) {
    console.log('Token expired, attempting refresh...')
    const refreshSuccess = await refreshToken()
    
    if (refreshSuccess) {
      // Get the updated tokens from localStorage since the context has been updated
      const updatedTokensStr = localStorage.getItem('tokens')
      const updatedTokens = updatedTokensStr ? JSON.parse(updatedTokensStr) : null
      
      if (updatedTokens?.access) {
        // Retry the request with the new token
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${updatedTokens.access}`,
        }
        
        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        })
      }
    }
  }

  return response
} 