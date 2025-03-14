'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/ssr_client/client'
import toast from 'react-hot-toast'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const confirmUser = async () => {
      const supabase = createClient()

      const token = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!token || !type) {
        toast.error('Invalid confirmation link')
        router.push('/login')
        return
      }

      try {
        // Confirm user using Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'signup',
        })

        if (error) {
          toast.error(`Confirmation failed: ${error.message}`)
          router.push('/login')
          return
        }

        toast.success('Account confirmed! Please log in.')
        router.push('/login')
      } catch (error) {
        console.error('Error confirming user:', error)
        toast.error('An error occurred. Please try again.')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    confirmUser()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {loading ? (
        <p className="text-gray-700">Confirming your account...</p>
      ) : (
        <p className="text-gray-700">Redirecting...</p>
      )}
    </div>
  )
}
