// App.jsx

import './App.css';
// Bringing in the required import from 'react-router-dom'
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
 
// subjects //

function App() {
  return (
 
      <>
        <header className="header">
          <Header />
 
        </header>
 

          <main className="main-content mx-3">
            <Outlet />
          </main>
 
        <Footer />
      </>
 
  );
}

export default App;