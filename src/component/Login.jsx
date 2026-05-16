import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import oyrtmaLogo from '../assets/OYRTMA.png'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate() 

  const brandGreen = '#007A33'
  const brandRed = '#DA291C'

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username: username,
        password: password
      })

      console.log("DJANGO TOKEN RESPONSE:", response.data)

      if (response.data.user_role === 'Citizen') {
        setError('Access Restricted: Citizens must use the Public Portal.')
        setIsLoading(false)
        return 
      }

      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      
      
      navigate('/dashboard')

    } catch (err) {
      setError('Invalid credentials. Access denied.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f4f9', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <img src={oyrtmaLogo} alt="OYRTMA Logo" style={{ width: '120px', marginBottom: '10px' }} />
        <h2 style={{ color: '#333', marginBottom: '5px' }}>Officer Portal</h2>
        <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>Log in to the traffic management system</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Officer Username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }} />
          <button type="submit" disabled={isLoading} style={{ padding: '12px', fontSize: '16px', backgroundColor: isLoading ? '#80bd99' : brandGreen, color: 'white', border: 'none', borderRadius: '5px', cursor: isLoading ? 'wait' : 'pointer', fontWeight: 'bold', transition: 'background-color 0.3s' }}>
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        {error && <p style={{ color: brandRed, fontWeight: 'bold', marginTop: '15px' }}>{error}</p>}

        <p style={{ marginTop: '25px', fontSize: '15px', color: '#444' }}>
          Driver with a ticket? <span onClick={() => navigate('/offender-signup')} style={{ color: brandGreen, cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Register Here to Pay</span>
        </p>
        
        <p style={{ marginTop: '15px', fontSize: '13px', color: '#888' }}>
          OYRTMA Personnel? <span onClick={() => navigate('/signup')} style={{ color: '#0056b3', cursor: 'pointer', textDecoration: 'underline' }}>Request Official Access</span>
        </p>

      </div>
    </div>
  )
}

export default Login