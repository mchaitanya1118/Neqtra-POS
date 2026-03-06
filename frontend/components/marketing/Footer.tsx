import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 pt-20 pb-10 font-sans">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">

                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">
                                N
                            </div>
                            <span className="font-sans font-bold text-2xl tracking-tight text-black">
                                Neqtra
                            </span>
                        </Link>
                        <p className="text-gray-500 text-[15px] leading-relaxed max-w-sm font-medium">
                            Empowering modern businesses with intelligent, offline-first POS solutions.
                            Run your restaurant or retail store smarter, faster, and more efficiently.
                        </p>
                    </div>

                    {/* Links Column 1 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-black mb-2">Product</h4>
                        <Link href="/features" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
                        <Link href="/pricing" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
                        <Link href="/hardware" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Hardware</Link>
                        <Link href="/integrations" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Integrations</Link>
                    </div>

                    {/* Links Column 2 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-black mb-2">Company</h4>
                        <Link href="/about" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">About Us</Link>
                        <Link href="/careers" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Careers</Link>
                        <Link href="/blog" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Blog</Link>
                        <Link href="/contact" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Contact</Link>
                    </div>

                    {/* Links Column 3 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-black mb-2">Legal</h4>
                        <Link href="/terms" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link href="/security" className="text-[15px] font-medium text-gray-600 hover:text-blue-600 transition-colors">Security</Link>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[14px] text-gray-500 font-medium">
                        &copy; {new Date().getFullYear()} Neqtra POS Inc. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Twitter className="w-5 h-5 fill-current" /></Link>
                        <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook className="w-5 h-5 fill-current" /></Link>
                        <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Instagram className="w-5 h-5 fill-current" /></Link>
                        <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Linkedin className="w-5 h-5 fill-current" /></Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
