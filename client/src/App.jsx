import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import LogStream from './pages/LogStream';
import Analysis from './pages/Analysis';
import MitreAttack from './pages/MitreAttack';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="upload" element={<Upload />} />
                    <Route path="stream" element={<LogStream />} />
                    <Route path="analysis" element={<Analysis />} />
                    <Route path="analysis/:sessionId" element={<Analysis />} />
                    <Route path="mitre" element={<MitreAttack />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
