import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CorrespondentDashboard from './pages/CorrespondentDashboard';
import ExpeditorDashboard from './pages/ExpeditorDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/correspondent" element={<CorrespondentDashboard />} />
        <Route path="/expeditor" element={<ExpeditorDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;