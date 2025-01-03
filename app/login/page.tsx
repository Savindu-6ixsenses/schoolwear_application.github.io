import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <form className='flex flex-col w-[200px] m-auto'>
      <label htmlFor="email" className='text-black'>Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password" className='text-black'>Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login} className='text-black border border-black'>Log in</button>
      <button formAction={signup} className='text-black ml-3 border border-black'>Sign up</button>
    </form>
  )
}