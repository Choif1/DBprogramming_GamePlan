import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Project from './pages/Project';
import ProjectCreate from './pages/ProjectCreate';
import ProjectDetail from './pages/ProjectDetail';
import MyProject from './pages/MyProject';
import ProjectEdit from './pages/ProjectEdit';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('gameplan_token')));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gameplan_user') || 'null');
    } catch {
      return null;
    }
  });

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        }
      >
        <Route index element={<Home />} />
        <Route path="projects" element={<Project />} />
        <Route path="projects/new" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ProjectCreate /></ProtectedRoute>} />
        <Route path="projects/:id/edit" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ProjectEdit /></ProtectedRoute>} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="my-projects" element={<ProtectedRoute isLoggedIn={isLoggedIn}><MyProject /></ProtectedRoute>} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="account" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Account /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default App
