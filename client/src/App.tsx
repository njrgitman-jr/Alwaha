import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import TopBar from './components/TopBar';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingActions from './components/FloatingActions';
import Home from './pages/Home';
import Product from './pages/Product';
import Category from './pages/Category';
import Accessories from './pages/Accessories';
import AccessoryDetail from './pages/AccessoryDetail';
import Contact from './pages/Contact';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';

function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="glass-card">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-extrabold">الصفحة غير موجودة</h1>
        <Link to="/" className="btn-primary mt-6">العودة للرئيسية</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="*" element={<PublicShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function PublicShell() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/accessory/:slug" element={<AccessoryDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <FloatingActions />
    </div>
  );
}
