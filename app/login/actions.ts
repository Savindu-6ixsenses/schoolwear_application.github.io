'use server' ;

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/ssr_client/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const {data:signInData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("An Error occured: ",error)
    return {
      success: false,
      error: error.message,
      code: error.code || 'unknown_error',
    };
  }

  console.log("Sign In Data: ", signInData)
  // ✅ Successful login

  revalidatePath('/', 'layout')
  redirect('/')
}

// export async function signup(formData: FormData) {
//   const supabase = createClient()

//   // type-casting here for convenience
//   // in practice, you should validate your inputs
//   const data = {
//     email: formData.get('email') as string,
//     password: formData.get('password') as string,
//   }

//   const { error } = await supabase.auth.signUp(data)

//   if (error) {
//     console.error("An Error occured: ",error)
//     return { error: error}
//   }

//   revalidatePath('/', 'layout')
//   redirect('/')
// }

export async function signup(formData: FormData) {
  const supabase = createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  
  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.error("An Error occurred: ", error);
    return {
      success: false,
      error: error.message,
      code: error.code || 'unknown_error',
    };
  }

  // ✅ Successful signup (but email confirmation is required)
  return {
    success: true,
    message: `Signup successful! Please check your email (${data.email}) to confirm your account.`,
  };
}
