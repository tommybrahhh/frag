import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        
        {/* Header */}
        <div className="mb-12 border-b border-stone-200 pb-8">
          <h1 className="font-serif text-4xl mb-4 text-stone-900">Privacy Policy</h1>
          <p className="text-stone-500 text-sm">Last updated: December 22, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-normal prose-p:text-sm prose-p:leading-relaxed">
          <p>
            At Scentia, we value your privacy. This policy explains how we handle your data when you use our fragrance discovery and analysis tools.
          </p>

          <h3>1. Information We Collect</h3>
          <p>
            We collect only the essential information needed to provide our services:
          </p>
          <ul>
            <li><strong>Account Data:</strong> If you sign up, we collect your email address and authentication details via our secure provider (Supabase).</li>
            <li><strong>Preferences:</strong> We store your "Shelf" (collection), quiz results, and any ratings you provide to generate personalized recommendations.</li>
            <li><strong>Usage Data:</strong> We may collect anonymous analytics on how features like the "Layering Lab" or "Note Picker" are used to improve the experience.</li>
          </ul>

          <h3>2. How We Use Your Data</h3>
          <p>
            Your data is used exclusively for:
          </p>
          <ul>
            <li>Generating your personalized "Scent DNA" profile.</li>
            <li>Calculating compatibility matches and layering suggestions.</li>
            <li>Syncing your collection across devices.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data to third-party advertisers.
          </p>

          <h3>3. Data Security</h3>
          <p>
            We utilize industry-standard encryption and security practices. Authentication is handled by Supabase, a secure backend-as-a-service provider.
          </p>

          <h3>4. Cookies</h3>
          <p>
            We use strictly necessary cookies to maintain your login session. We may use optional analytics cookies to understand site traffic, which you can opt-out of.
          </p>

          <h3>5. Contact Us</h3>
          <p>
            If you have questions about your data or wish to request deletion of your account, please contact us.
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
