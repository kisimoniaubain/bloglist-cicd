import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'soldyLanguage';

const TRANSLATIONS = {
  en: {
    common: {
      home: 'Home',
      products: 'Products',
      wishlist: 'Wishlist',
      cart: 'Cart',
      signIn: 'Sign In',
      profile: 'Profile',
      myOrders: 'My Orders',
      settings: 'Settings',
      adminPanel: 'Admin Panel',
      logout: 'Logout',
      shopNow: 'Shop Now',
      continueShopping: 'Continue Shopping',
      back: 'Back',
      next: 'Next',
      save: 'Save',
      apply: 'Apply',
      remove: 'Remove',
      viewAll: 'View All',
      loading: 'Loading...',
      reconnectAccount: 'Reconnect Account',
      websiteModeActive: 'Website mode active',
      allProducts: 'All Products',
      newest: 'Newest',
      priceLowHigh: 'Price: Low to High',
      priceHighLow: 'Price: High to Low',
      topRated: 'Top Rated',
      mostPopular: 'Most Popular',
      filters: 'Filters',
      clearFilters: 'Clear Filters',
      orderSummary: 'Order Summary',
      proceedToCheckout: 'Proceed to Checkout',
      startShopping: 'Start Shopping',
      noProductsFound: 'No products found',
      language: 'Language',
      appearance: 'Appearance',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      customizeExperience: 'Customize your app experience.',
    },
    home: {
      heroBadge: 'New arrivals every week',
      heroTitle1: 'Curated Furniture,',
      heroTitle2: 'Crafted For Living.',
      heroDesc:
        'Discover modern sofas, dining sets, bedroom pieces, and statement decor designed to elevate every room. Enjoy secure checkout with M-Pesa, Stripe, and more, plus fast delivery across Kenya.',
      bestSellers: 'Best Sellers',
      featuredProducts: 'Featured Products',
      handpicked: 'Handpicked for you',
      shopByCategory: 'Shop by Category',
      get20: 'Get 20% Off Your First Order',
      useCode: 'Use code',
      atCheckout: 'at checkout',
    },
    products: {
      furnitureShowcase: 'Furniture Photo Showcase',
      furnitureShowcaseDesc: 'More furniture product photos to explore before you shop',
      bestSellingFurniture: 'Best-Selling Furniture',
      bestSellingDesc: 'Trending furniture products people are buying now',
      viewBestSellingPhotos: 'View Best-Selling Photos',
      openProduct: 'Open product',
      noProductsHint: 'Try adjusting your search or filters',
      photoOf: 'Photo',
      of: 'of',
      openProductPage: 'Open product page',
      swipeHint: 'Swipe left or right on mobile',
    },
    cart: {
      shoppingCart: 'Shopping Cart',
      emptyTitle: 'Your cart is empty',
      emptyDesc: 'Add some products to get started',
      couponCode: 'Coupon Code',
      couponApplied: 'Coupon applied',
      subtotal: 'Subtotal',
      couponDiscount: 'Coupon Discount',
      shipping: 'Shipping',
      estimatedVat: 'Estimated VAT (16%)',
      cartTotal: 'Cart Total',
      estimatedPayable: 'Estimated Payable',
      finalTaxNote: 'Final tax and delivery are confirmed during checkout.',
      mustHaveTitle: 'What Must Be In Cart',
    },
    orders: {
      title: 'My Orders',
      emptyTitle: 'No orders yet',
      emptyDesc: 'Start shopping to see your orders here',
    },
    auth: {
      welcomeBack: 'Welcome back',
      signInAccount: 'Sign in to your SoldyHome account',
      createAccount: 'Create account',
      joinShoppers: 'Join thousands of happy SoldyHome shoppers',
      forgotPassword: 'Forgot password?',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      createOne: 'Create one',
      signIn: 'Sign in',
    },
  },
  sw: {
    common: {
      home: 'Nyumbani',
      products: 'Bidhaa',
      wishlist: 'Unachopenda',
      cart: 'Kikapu',
      signIn: 'Ingia',
      profile: 'Wasifu',
      myOrders: 'Maagizo Yangu',
      settings: 'Mipangilio',
      adminPanel: 'Paneli ya Admin',
      logout: 'Toka',
      shopNow: 'Nunua Sasa',
      continueShopping: 'Endelea Kununua',
      back: 'Rudi',
      next: 'Endelea',
      save: 'Hifadhi',
      apply: 'Tumia',
      remove: 'Ondoa',
      viewAll: 'Tazama Zote',
      loading: 'Inapakia...',
      reconnectAccount: 'Unganisha Akaunti Tena',
      websiteModeActive: 'Hali ya tovuti imewashwa',
      allProducts: 'Bidhaa Zote',
      newest: 'Mpya Zaidi',
      priceLowHigh: 'Bei: Chini hadi Juu',
      priceHighLow: 'Bei: Juu hadi Chini',
      topRated: 'Zilizokadiriwa Juu',
      mostPopular: 'Maarufu Zaidi',
      filters: 'Vichujio',
      clearFilters: 'Futa Vichujio',
      orderSummary: 'Muhtasari wa Oda',
      proceedToCheckout: 'Endelea Malipo',
      startShopping: 'Anza Kununua',
      noProductsFound: 'Hakuna bidhaa zilizopatikana',
      language: 'Lugha',
      appearance: 'Mwonekano',
      lightMode: 'Hali Nuru',
      darkMode: 'Hali Giza',
      customizeExperience: 'Binafsisha matumizi ya programu.',
    },
    home: {
      heroBadge: 'Bidhaa mpya kila wiki',
      heroTitle1: 'Samani Zilizochaguliwa,',
      heroTitle2: 'Zimetengenezwa Kwa Maisha.',
      heroDesc:
        'Gundua sofa za kisasa, seti za dining, samani za chumba cha kulala na mapambo bora ya nyumba. Lipa kwa usalama kupitia M-Pesa, Stripe na nyingine, pamoja na usafirishaji wa haraka Kenya nzima.',
      bestSellers: 'Zinazouzwa Zaidi',
      featuredProducts: 'Bidhaa Maalum',
      handpicked: 'Zimechaguliwa kwa ajili yako',
      shopByCategory: 'Nunua kwa Kategoria',
      get20: 'Pata Punguzo la 20% kwa Oda ya Kwanza',
      useCode: 'Tumia kodi',
      atCheckout: 'wakati wa malipo',
    },
    products: {
      furnitureShowcase: 'Maonesho ya Picha za Samani',
      furnitureShowcaseDesc: 'Picha zaidi za samani kabla hujanunua',
      bestSellingFurniture: 'Samani Zinazouzwa Zaidi',
      bestSellingDesc: 'Samani zinazovuma na kununuliwa sana',
      viewBestSellingPhotos: 'Tazama Picha za Zinazouzwa Zaidi',
      openProduct: 'Fungua bidhaa',
      noProductsHint: 'Jaribu kubadilisha utafutaji au vichujio',
      photoOf: 'Picha',
      of: 'ya',
      openProductPage: 'Fungua ukurasa wa bidhaa',
      swipeHint: 'Vuta kushoto au kulia kwenye simu',
    },
    cart: {
      shoppingCart: 'Kikapu cha Manunuzi',
      emptyTitle: 'Kikapu chako ni tupu',
      emptyDesc: 'Ongeza bidhaa uanze',
      couponCode: 'Msimbo wa Punguzo',
      couponApplied: 'Punguzo limetumika',
      subtotal: 'Jumla ndogo',
      couponDiscount: 'Punguzo la Kuponi',
      shipping: 'Usafirishaji',
      estimatedVat: 'Makadirio ya VAT (16%)',
      cartTotal: 'Jumla ya Kikapu',
      estimatedPayable: 'Jumla ya Kulipa',
      finalTaxNote: 'Kodi na usafirishaji wa mwisho huthibitishwa wakati wa malipo.',
      mustHaveTitle: 'Vinavyopaswa Kuwa Kwenye Kikapu',
    },
    orders: {
      title: 'Maagizo Yangu',
      emptyTitle: 'Hakuna oda bado',
      emptyDesc: 'Anza kununua ili kuona oda zako hapa',
    },
    auth: {
      welcomeBack: 'Karibu tena',
      signInAccount: 'Ingia kwenye akaunti yako ya SoldyHome',
      createAccount: 'Fungua akaunti',
      joinShoppers: 'Jiunge na wanunuzi wengi wenye furaha wa SoldyHome',
      forgotPassword: 'Umesahau nenosiri?',
      dontHaveAccount: 'Huna akaunti?',
      alreadyHaveAccount: 'Tayari una akaunti?',
      createOne: 'Fungua moja',
      signIn: 'Ingia',
    },
  },
  fr: {
    common: {
      home: 'Accueil',
      products: 'Produits',
      wishlist: 'Favoris',
      cart: 'Panier',
      signIn: 'Connexion',
      profile: 'Profil',
      myOrders: 'Mes Commandes',
      settings: 'Parametres',
      adminPanel: 'Admin',
      logout: 'Deconnexion',
      shopNow: 'Acheter',
      continueShopping: 'Continuer les achats',
      viewAll: 'Voir tout',
      loading: 'Chargement...',
      newest: 'Nouveautes',
      priceLowHigh: 'Prix: Croissant',
      priceHighLow: 'Prix: Decroissant',
      topRated: 'Mieux notes',
      mostPopular: 'Plus populaires',
      filters: 'Filtres',
      clearFilters: 'Effacer filtres',
      orderSummary: 'Resume de commande',
      proceedToCheckout: 'Passer au paiement',
      startShopping: 'Commencer les achats',
      noProductsFound: 'Aucun produit trouve',
      language: 'Langue',
      appearance: 'Apparence',
      lightMode: 'Mode clair',
      darkMode: 'Mode sombre',
      customizeExperience: "Personnalisez votre experience.",
      reconnectAccount: 'Reconnecter le compte',
      websiteModeActive: 'Mode site actif',
      allProducts: 'Tous les produits',
      apply: 'Appliquer',
      remove: 'Retirer',
    },
  },
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'fr', label: 'Francais' },
];

const LanguageContext = createContext(null);

const safeStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors to avoid hard crashes
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => safeStorageGet(STORAGE_KEY) || 'en');

  useEffect(() => {
    safeStorageSet(STORAGE_KEY, language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key, fallback = key) => {
    const parts = String(key).split('.');
    let value = TRANSLATIONS[language];
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    if (typeof value === 'string') return value;

    let english = TRANSLATIONS.en;
    for (const part of parts) {
      english = english?.[part];
      if (english === undefined) break;
    }
    if (typeof english === 'string') return english;

    return fallback;
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    languages: LANGUAGES,
    t,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
