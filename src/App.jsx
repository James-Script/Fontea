import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './utils/auth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Briefings from './pages/Briefings'
import BriefingDetail from './pages/BriefingDetail'
import NewBriefing from './pages/NewBriefing'
import Templates from './pages/Templates'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Users from './pages/Users'
import RegisterUser from './pages/RegisterUser'
import SelfRegister from './pages/SelfRegister'
import EditUser from './pages/EditUser'
import ViewUser from './pages/ViewUser'

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<SelfRegister />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="briefings" element={<Briefings />} />
          <Route path="briefings/:id" element={<BriefingDetail />} />
          <Route path="briefings/new" element={<NewBriefing />} />
          <Route path="templates" element={<Templates />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<Users />} />
          <Route path="users/register" element={<RegisterUser />} />
          <Route path="users/:userId/edit" element={<EditUser />} />
          <Route path="users/:userId/view" element={<ViewUser />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
