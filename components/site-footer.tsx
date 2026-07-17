import Link from "next/link";
import { snsLinks } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="bg-black text-white pt-12 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 mb-12 md:mb-24">
          {/* Logo & Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-black tracking-tighter mb-4">rt18_formula1</h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Official website featuring F1 fan art, illustrations, and the latest news from the world of Formula 1.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {snsLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:bg-white/15 hover:scale-110"
                  title={link.name}
                >
                  <img src={link.icon} alt={link.name} width={28} height={28}
                    className="w-7 h-7 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="grid grid-cols-3 gap-8 md:col-span-2">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Main Menu</h4>
              <ul className="space-y-5">
                <li><Link href="/#top" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/#profile" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Profile</Link></li>
                <li><Link href="/news" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">News</Link></li>
                <li><Link href="/portfolio" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Portfolio</Link></li>
                <li><Link href="/calendar" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Calendar</Link></li>
                <li><Link href="/f1-database" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">F1 DB</Link></li>
                <li><Link href="/f1-database?tab=sns-post" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">SNS Post</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Shop</h4>
              <ul className="space-y-5">
                <li><Link href="/shop" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/shop?type=digital" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Digital</Link></li>
                <li><Link href="/shop?type=physical" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Goods</Link></li>
                <li><Link href="/shop/commission" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Commission</Link></li>
                <li><Link href="/shop/mypage" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">My Page</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Inquiries</h4>
              <ul className="space-y-5">
                <li><Link href="/shop/inquiry" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/#request" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Request</Link></li>
                <li><a href="https://forms.gle/sCnwiNJ5gkLLt9Bn8" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Feedback</a></li>
                <li><Link href="/cookie-privacy-policy" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 space-y-6">
          {/* SNS text row */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {snsLinks.map((link) => (
              <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
                {link.name}
              </a>
            ))}
          </div>
          {/* Bottom row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-gray-500">
              &copy; {new Date().getFullYear()} rt18_formula1. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Link href="/cookie-privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="opacity-20">|</span>
              <Link href="/admin" className="hover:text-white transition-colors">Admin Access</Link>
              <span className="opacity-20">|</span>
              <span>Based in Japan</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}