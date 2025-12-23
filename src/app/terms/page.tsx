import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="mb-12 border-b border-stone-200 pb-8">
          <h1 className="font-serif text-4xl mb-4 text-stone-900">Terms of Service</h1>
          <p className="text-stone-500 text-sm">Last updated: December 22, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-normal prose-p:text-sm prose-p:leading-relaxed">
          <h3>1. Introduction</h3>
          <p>
            Welcome to Scentia. By accessing our website and using our fragrance analysis tools, you agree to these Terms of Service.
          </p>

          <h3>2. The Service</h3>
          <p>
            Scentia provides algorithmic recommendations, chemical analysis simulations (e.g., "Layering Lab"), and database search tools for fragrances. 
          </p>
          <p>
            <strong>Disclaimer:</strong> Our "Safety" and "Stability" scores in the Layering Lab are algorithmic approximations based on olfactory theory. We are not responsible for the actual result of mixing physical products. Always test on a blotter strip first.
          </p>

          <h3>3. User Accounts</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account. You typically do not need an account to browse, but one is required to save collections and recipes.
          </p>

          <h3>4. Intellectual Property</h3>
          <p>
            The recommendation algorithms, "Scent DNA" logic, and UI design are the property of Scentia. Perfume names, brand names, and images are the property of their respective owners and are used for informational/identification purposes only.
          </p>

          <h3>5. Limitation of Liability</h3>
          <p>
            Scentia is provided "as is". We make no warranties regarding the accuracy of scent notes or longevity ratings, which are subjective and aggregated from various sources.
          </p>

          <h3>6. Changes to Terms</h3>
          <p>
            We may update these terms at any time. Continued use of the service constitutes acceptance of the new terms.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition">
            ← Return to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
