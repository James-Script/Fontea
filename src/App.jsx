import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './utils/auth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Briefings from './pages/Briefings'
import BriefingDetail from './pages/BriefingDetail'
import ErrorBoundary from './components/ErrorBoundary'
import NewBriefing from './pages/NewBriefing'
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
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="briefings" element={<ErrorBoundary><Briefings /></ErrorBoundary>} />
          <Route path="briefings/:id" element={<ErrorBoundary><BriefingDetail /></ErrorBoundary>} />
          <Route path="briefings/new" element={<ErrorBoundary><NewBriefing /></ErrorBoundary>} />
          
          <Route path="analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
          <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          <Route path="users" element={<ErrorBoundary><Users /></ErrorBoundary>} />
          <Route path="users/register" element={<ErrorBoundary><RegisterUser /></ErrorBoundary>} />
          <Route path="users/:userId/edit" element={<ErrorBoundary><EditUser /></ErrorBoundary>} />
          <Route path="users/:userId/view" element={<ErrorBoundary><ViewUser /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
