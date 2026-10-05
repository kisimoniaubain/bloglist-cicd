import { applyImageFallback, normalizeImageUrl } from '../utils/imageUrl';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import furnitureProducts from '../data/furnitureProducts';
import { Star, ArrowRight, CheckCircle, Heart, Truck, Award, Users, Phone, Mail, MapPin, ChevronDown, Menu, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import BrandLogo from '../components/BrandLogo';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import api from '../services/api';
import { isVideoUrl } from '../utils/imageUrl';
import { logout } from '../redux/slices/authSlice';

export default function Explore() {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);

  const displayName = String(user?.name || user?.fullName || 'Kisimoni Aubain');
  const displayInitial = String(displayName[0] || 'K').toUpperCase();

  const handleNavbarLogout = () => {
    dispatch(logout());
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    navigate('/', { replace: true });
  };

  const heroImages = [
    'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2356065/pexels-photo-2356065.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ];

  const whyChooseUs = [
    {
      icon: Award,
      title: 'Premium Quality',
      desc: 'Handpicked furniture from trusted brands with exceptional craftsmanship'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      desc: 'Free shipping on orders above KSh 2,000 with same-day options in Nairobi'
    },
    {
      icon: Heart,
      title: 'Customer Care',
      desc: 'Dedicated support team ready to help you find the perfect piece'
    },
    {
      icon: CheckCircle,
      title: 'Easy Returns',
      desc: '30-day money-back guarantee if you\'re not completely satisfied'
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Kimani',
      location: 'Nairobi',
      text: 'The sofa I ordered exceeded my expectations! Excellent quality and fast delivery. Highly recommend!',
      rating: 5,
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    {
      name: 'James Okonkwo',
      location: 'Mombasa',
      text: 'Great selection of modern furniture. The customer service team was very helpful in choosing the right dining set.',
      rating: 5,
      avatar: 'https://i.pravatar.cc/150?img=2'
    },
    {
      name: 'Alice Mutua',
      location: 'Kisumu',
      text: 'Best furniture shopping experience online. Quality is outstanding and delivery was on time!',
      rating: 5,
      avatar: 'https://i.pravatar.cc/150?img=3'
    },
  ];

  const topProducts = furnitureProducts
    .filter(p => p.isActive)
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 8);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_0n7u9ra';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_o47h07g';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'w9H1Onw0PA9CSEtYf';

    try {
      setSendingMessage(true);
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contactForm.name)}&background=random`;

      try {
        await emailjs.send(
          serviceId,
          templateId,
          {
            user_name: contactForm.name,
            user_email: contactForm.email,
            subject: contactForm.subject,
            message: contactForm.message,
            avatar,
          },
          { publicKey }
        );
      } catch (emailJsError) {
        // Fallback to backend SMTP endpoint if EmailJS fails.
        await api.post('/contact', contactForm);
      }

      toast.success('Message sent successfully');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Message failed to send. Please try again in a moment.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Custom Navbar */}
      <nav className="sticky top-0 z-50 bg-[#111827] border-b border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/explore" className="flex items-center gap-2">
              <BrandLogo compact />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { id: 'home', label: 'Home', href: '#home' },
                { id: 'about', label: 'About', href: '#about' },
                { id: 'what-we-do', label: 'What We Do', href: '#what-we-do' },
                { id: 'gallery', label: 'Gallery', href: '#gallery' },
                { id: 'contact', label: 'Contact', href: '#contact' },
              ].map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'text-[#b45309] font-bold'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Shop Now + User Quick Links */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-[#b45309] hover:bg-[#b45309] text-white font-bold px-6 py-2 rounded-xl transition-colors text-sm"
              >
                Shop Now <ArrowRight size={16} />
              </Link>

              {user && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 text-sm text-white/90 border border-white/20 rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
                      {displayInitial}
                    </span>
                    <span className="font-semibold max-w-[130px] truncate">{displayName}</span>
                    <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-white/90 hover:text-[#b45309] dark:hover:text-[#b45309] hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-white/90 hover:text-[#b45309] dark:hover:text-[#b45309] hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-white/90 hover:text-[#b45309] dark:hover:text-[#b45309] hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                      >
                        Settings
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#b45309] font-semibold hover:text-white hover:bg-[#b45309] transition-all"
                        >
                          Admin Panel
                        </Link>
                      )}

                      <div className="my-1 border-t border-gray-200 dark:border-gray-600" />

                      <button
                        type="button"
                        onClick={handleNavbarLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-white/5 transition-all"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About' },
                { id: 'what-we-do', label: 'What We Do' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'contact', label: 'Contact' },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="block text-white/80 hover:text-[#b45309] px-4 py-2 text-sm"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/products"
                className="block bg-[#b45309] hover:bg-[#b45309] text-white font-bold px-4 py-2 rounded-lg text-sm text-center"
              >
                Shop Now
              </Link>

              {user && (
                <div className="mt-2 border border-white/20 rounded-lg p-3 bg-white/5 text-white/90 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 text-xs font-bold flex items-center justify-center">{displayInitial}</span>
                    <span className="text-sm font-semibold truncate">{displayName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1 rounded hover:bg-white/10">Profile</Link>
                    <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1 rounded hover:bg-white/10">My Orders</Link>
                    <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1 rounded hover:bg-white/10">Settings</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1 rounded hover:bg-white/10">Admin Panel</Link>
                    )}
                    <button type="button" onClick={handleNavbarLogout} className="px-2 py-1 rounded hover:bg-white/10">Logout</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section - Home */}
        <section id="home" className="relative h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
          {heroImages.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
            </div>
          ))}
        
        <div className="relative h-full flex items-center justify-center text-center text-white px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
              Welcome to <span className="text-[#b45309]">Soldy</span><span className="text-[#b45309]">Home</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              Discover beautifully designed furniture that transforms houses into homes
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#b45309] hover:bg-[#b45309] text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Shop Now <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentImageIndex ? 'bg-[#b45309] w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-20 px-4 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Your Journey to a Beautiful Home Starts Here
              </h2>
              <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                At SoldyHome, we believe that furniture is more than just functional pieces—it's about creating spaces where memories are made and life is lived to the fullest.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Since our launch, we've been committed to curating the finest selection of modern, contemporary, and classic furniture pieces that cater to every style and budget. From cozy sofas to elegant dining sets, we have something for everyone.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-[#b45309] flex-shrink-0" />
                  <span className="text-gray-700">Curated by design experts</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-[#b45309] flex-shrink-0" />
                  <span className="text-gray-700">Quality guaranteed on every piece</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-[#b45309] flex-shrink-0" />
                  <span className="text-gray-700">Affordable luxury for modern living</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl h-[400px]">
              <img
                src="https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="About us"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="what-we-do" className="py-16 sm:py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-[#b45309] rounded-lg flex items-center justify-center mb-4">
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Our Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {topProducts.slice(0, 4).map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="group relative rounded-xl overflow-hidden h-[300px] bg-gray-100"
              >
                {isVideoUrl(product.images?.[0]) ? (
                  <video
                    src={normalizeImageUrl(product.images?.[0])}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={normalizeImageUrl(product.images?.[0]) || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    onError={(e) => applyImageFallback(e, 0)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <p className="text-[#b45309] font-semibold">KSh {(product.discountPrice || product.price).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#b45309] hover:bg-[#b45309] text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              View All Collections <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#b45309] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Call Us</h3>
              <p className="text-white/80">+254 700 123 456</p>
              <p className="text-white/80">+254 734 567 890</p>
              <p className="text-sm text-white/60 mt-2">Monday - Friday, 9AM - 6PM</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#b45309] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Email Us</h3>
              <p className="text-white/80">support@soldyhome.com</p>
              <p className="text-white/80">info@soldyhome.com</p>
              <p className="text-sm text-white/60 mt-2">We respond within 24 hours</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#b45309] rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Visit Us</h3>
              <p className="text-white/80">Nairobi, Kenya</p>
              <p className="text-white/80">Westlands Business District</p>
              <p className="text-sm text-white/60 mt-2">By appointment</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your Name"
                  required
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#b45309]"
                />
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Your Email"
                  required
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#b45309]"
                />
              </div>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject"
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#b45309]"
              />
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Your Message"
                rows={4}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#b45309] resize-none"
              ></textarea>
              <button
                type="submit"
                disabled={sendingMessage}
                className="w-full bg-[#b45309] hover:bg-[#b45309] text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-[#b45309] text-[#b45309]" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-r from-[#b45309] to-[#b45309] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Your Space?</h2>
          <p className="text-lg text-white/90 mb-8">
            Browse our complete collection and find the perfect furniture for your home today.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#b45309] font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#111827] text-white/80 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <BrandLogo />
              <p className="text-sm text-white/60 mt-4">
                Curated furniture for modern living. Quality, style, and comfort delivered to your door.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="hover:text-[#b45309] transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-[#b45309] transition-colors">About</a></li>
                <li><a href="#gallery" className="hover:text-[#b45309] transition-colors">Gallery</a></li>
                <li><a href="#contact" className="hover:text-[#b45309] transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Shop */}
            <div>
              <h3 className="text-white font-bold mb-4">Shop</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-[#b45309] transition-colors">All Products</Link></li>
                <li><Link to="/products?sort=popular" className="hover:text-[#b45309] transition-colors">Best Sellers</Link></li>
                <li><Link to="/wishlist" className="hover:text-[#b45309] transition-colors">Wishlist</Link></li>
                <li><Link to="/cart" className="hover:text-[#b45309] transition-colors">Cart</Link></li>
              </ul>
            </div>

            {/* Info */}
            <div>
              <h3 className="text-white font-bold mb-4">Info</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#contact" className="hover:text-[#b45309] transition-colors">Contact Us</a></li>
                <li><Link to="/privacy-policy" className="hover:text-[#b45309] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-and-conditions" className="hover:text-[#b45309] transition-colors">Terms & Conditions</Link></li>
                <li><a href="/" className="hover:text-[#b45309] transition-colors">Returns</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <p className="text-center text-sm text-white/60">
              © 2026 <span className="text-[#b45309]">Soldy</span><span className="text-[#b45309]">Home</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

