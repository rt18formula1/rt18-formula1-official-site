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
                  className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                  title={link.name}
                >
                  <img 
                    src={link.icon} 
                    alt={link.name} 
                    className="w-7 h-7 object-contain opacity-80" 
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Main Menu</h4>
              <ul className="space-y-5">
                <li><Link href="/#top" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/#profile" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Profile</Link></li>
                <li><Link href="/news" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">News</Link></li>
                <li><Link href="/portfolio" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Portfolio</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Inquiries</h4>
              <ul className="space-y-5">
                <li><Link href="/#request" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Illustration Request</Link></li>
                <li><Link href="/#contact" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Contact</Link></li>
                <li><a href="https://forms.gle/sCnwiNJ5gkLLt9Bn8" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Feedback</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-xs font-bold text-gray-500">
            © {new Date().getFullYear()} rt18_formula1. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <Link href="/admin" className="hover:text-white transition-colors">Admin Access</Link>
            <span className="opacity-20">|</span>
            <span>Based in Japan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
