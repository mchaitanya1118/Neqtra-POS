import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-surface/30 border-t border-surface-light pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">

                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-fg font-bold text-xl">
                                N
                            </div>
                            <span className="font-serif italic font-bold text-xl tracking-tight text-foreground">
                                Neqtra
                            </span>
                        </Link>
                        <p className="text-muted text-sm leading-relaxed max-w-sm">
                            Empowering modern businesses with intelligent, offline-first POS solutions.
                            Run your restaurant or retail store smarter, faster, and more efficiently.
                        </p>
                    </div>

                    {/* Links Column 1 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-foreground">Product</h4>
                        <Link href="/features" className="text-sm text-muted hover:text-primary transition-colors">Features</Link>
                        <Link href="/pricing" className="text-sm text-muted hover:text-primary transition-colors">Pricing</Link>
                        <Link href="/hardware" className="text-sm text-muted hover:text-primary transition-colors">Hardware</Link>
                        <Link href="/integrations" className="text-sm text-muted hover:text-primary transition-colors">Integrations</Link>
                    </div>

                    {/* Links Column 2 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-foreground">Company</h4>
                        <Link href="/about" className="text-sm text-muted hover:text-primary transition-colors">About Us</Link>
                        <Link href="/careers" className="text-sm text-muted hover:text-primary transition-colors">Careers</Link>
                        <Link href="/blog" className="text-sm text-muted hover:text-primary transition-colors">Blog</Link>
                        <Link href="/contact" className="text-sm text-muted hover:text-primary transition-colors">Contact</Link>
                    </div>

                    {/* Links Column 3 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-foreground">Legal</h4>
                        <Link href="/terms" className="text-sm text-muted hover:text-primary transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="text-sm text-muted hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/security" className="text-sm text-muted hover:text-primary transition-colors">Security</Link>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-surface-light flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted">
                        &copy; {new Date().getFullYear()} Neqtra POS Inc. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-muted hover:text-primary transition-colors"><Twitter className="w-4 h-4" /></Link>
                        <Link href="#" className="text-muted hover:text-primary transition-colors"><Facebook className="w-4 h-4" /></Link>
                        <Link href="#" className="text-muted hover:text-primary transition-colors"><Instagram className="w-4 h-4" /></Link>
                        <Link href="#" className="text-muted hover:text-primary transition-colors"><Linkedin className="w-4 h-4" /></Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
