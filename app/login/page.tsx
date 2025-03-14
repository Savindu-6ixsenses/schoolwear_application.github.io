'use client'

import { login } from './actions'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/utils/supabase/ssr_client/client'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (data?.session) {
        toast('You are already logged in.',{ icon: '✅' })
        router.push('/')
      }
    }

    checkSession()
  }, [router])

  async function handleSubmit(
    action: (formData: FormData) => Promise<{ error?: string } | void>, // Allow action to return error
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setIsLoading(true);
  
    try {
      const formData = new FormData(event.currentTarget);
  
      // ✅ Capture the response
      const result = await action(formData);

      console.log(result);
  
      if (result?.error) {
        // ✅ Display the error
        toast.error(result.error);
        return;
      }
  
      // ✅ No need to manually redirect since the server action handles it
      toast.success('Login successful!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <form 
        onSubmit={(e) => handleSubmit(login, e)} 
        className="w-full max-w-sm bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4"
      >
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 text-center">
          Welcome Back!
        </h2>

        {/* Email Input */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            Email:
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
            Password:
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>

        {/* Signup Link */}
        <div className="flex flex-col items-center mt-4">
          <p className="text-gray-600">Don&apos;t have an account?</p>
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="mt-2 text-blue-500 hover:underline"
          >
            Sign up here
          </button>
        </div>
      </form>
    </div>
  );
}


