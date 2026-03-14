import React from 'react'
import '../login/login.css'

const Login = () => {
  return (
    <div className='login-main'>
        <section className='login'>
            <h2 className='title'>Solaris Admin Login</h2>
            <input type="text" className='username'placeholder='username'/>
            <input type="password" className='password'placeholder='password'/>
            <p>Forgot Password? <a className="reset" href="">Reset Password</a></p>
            <button className='login-btn'>
                Login
            </button>
        </section>
    </div>
  )
}

export default Login