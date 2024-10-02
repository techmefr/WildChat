import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthentificationContext';

import Cookies from 'js-cookie';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import { Route, Routes, Navigate } from 'react-router-dom';

import { LoginForm } from './components/authentification/Login';
import { RegisterForm } from './components/authentification/Register';
import PolitiquePrive from './pages/PolitiquePrive';
import { MediaProvider } from './context/MediaContext';



const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const token = Cookies.get('token');
  const decoded: any = token && jwtDecode<JwtPayload>(token);
  const date = new Date(decoded?.exp * 1000);
  return token && decoded?.exp * 1000 > new Date().getTime() ? (
    <>{children}</>
  ) : (
    <Navigate to='/login' replace />
  );
};

root.render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/politique_prive" element={<PolitiquePrive />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MediaProvider>
              <App />
            </MediaProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
