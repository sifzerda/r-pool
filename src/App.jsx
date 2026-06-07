// App.jsx

import { Outlet } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import NeonLayout from "./components/NeonLayout";

function App() {
  return (
    <NeonLayout>
      <div className="min-h-screen flex flex-col">
        <header>
          <Header />
        </header>

        <main className="flex-1 mx-3">
          <Outlet />
        </main>

        <Footer />
      </div>
    </NeonLayout>
  );
}

export default App;