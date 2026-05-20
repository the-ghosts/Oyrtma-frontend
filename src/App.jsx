import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './component/Login'
import Dashboard from './component/Dashboard'
import CreateTicket from './component/CreateTicket'
import Signup from './component/Signup' 
import OffenderSignup from './component/OffenderSignup' 
import OffenderLogin from './component/OffenderLogin'
import OffenderDashboard from './component/OffenderDashboard' 
import AdminDashboard from './component/AdminDashboard'
import ForgotPassword from './component/ForgotPassword'
import ResetPassword from './component/ResetPassword'
import OffenderForgotPassword from './component/OffenderForgotPassword'
import Receipt from './component/Receipt'
import PaymentCallback from './component/PaymentCallback'

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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
        <Route path="/offender-forgot-password" element={<OffenderForgotPassword />} />
        <Route path="/receipt" element= {<Receipt/>} />
        <Route path="/payment-callback" element={<PaymentCallback/>} />
      
      </Routes>
    </BrowserRouter>
  )
}

export default App