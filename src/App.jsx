// App.jsx

import './App.css';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header">
        <Header />
      </header>

      <main className="flex-1 mx-3">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default App;