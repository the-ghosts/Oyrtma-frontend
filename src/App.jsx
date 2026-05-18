import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './component/Login'
import Dashboard from './component/Dashboard'
import CreateTicket from './component/CreateTicket'
import Signup from './component/Signup' 
import OffenderSignup from './component/OffenderSignup' 
import OffenderLogin from './component/OffenderLogin'
import OffenderDashboard from './component/OffenderDashboard' 
import AdminDashboard from './component/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/offender-signup" element={<OffenderSignup />} />
        <Route path="/offender-login" element={<OffenderLogin />} />
        <Route path="/offender-dashboard" element={<OffenderDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard/>}/>
      
      </Routes>
    </BrowserRouter>
  )
}

export default App