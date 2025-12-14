'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import RecommendationsList from '@/components/RecommendationsList';
import Link from 'next/link';
import WardrobeAnalytics from '@/components/WardrobeAnalytics';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'collection' | 'mixes'>('collection'); // Default to collection
  const [savedMixes, setSavedMixes] = useState<any[]>([]);
  const [collection, setCollection] = useState<any[]>([]);
  
  // Profile State
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // 2. Fetch User Data (Robust Version)
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // A. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, signature_scent:perfumes!profiles_signature_scent_id_fkey(id, name, image_url, brand:brands(name))')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileData) {
          setProfile(profileData);
          setDisplayName(profileData.display_name || '');
          setBio(profileData.bio || '');
        }

        // B. Fetch Wardrobe (With Safety Checks)
        const { data: collectionData, error: collectionError } = await supabase
          .from('user_collections')
          .select(`
            id,
            perfume:perfumes(
              id, name, image_url, vibe_tags, best_season,
              brand:brands(name)
            )
          `)
          .eq('user_id', user.id);

        if (collectionError) console.error("Wardrobe Fetch Error:", collectionError);
        
        // FILTERING: Remove items where 'perfume' is null (deleted/broken references)
        // This fixes the "Wardrobe not showing anything" bug
        const validCollection = (collectionData || []).filter((item: any) => item.perfume && item.perfume.id);
        setCollection(validCollection);

        // C. Fetch Mixes
        const { data: mixes } = await supabase
          .from('saved_mixes')
          .select(`*, base:perfumes!base_perfume_id(name, image_url), top:perfumes!top_perfume_id(name, image_url)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setSavedMixes(mixes || []);

      } catch (err) {
        console.error("Critical Profile Error:", err);
      }
    };

    fetchData();
  }, [user]);

  // 3. Save Profile
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      bio: bio,
      updated_at: new Date().toISOString()
    });
    if (!error) {
      setProfile({ ...profile, display_name: displayName, bio });
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-stone-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  if (!user) return null; // Will redirect via useEffect

  return (
    <div className="min-h-screen bg-background text-primary pb-24 font-sans">
      
      {/* HEADER */}
      <div className="bg-surface border-b border-border pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end gap-8">
          
          {/* Avatar / Signature Scent */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-hover border-4 border-surface shadow-xl flex items-center justify-center overflow-hidden">
              {profile?.signature_scent ? (
                <img src={profile.signature_scent.image_url} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
              ) : (
                <span className="text-4xl text-stone-300">USER</span>
              )}
            </div>
            {/* Edit Trigger */}
            <button onClick={() => setIsEditing(!isEditing)} className="absolute bottom-0 right-0 bg-primary text-surface p-2 rounded-full hover:scale-110 transition shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 w-full">
            {isEditing ? (
              <div className="space-y-4 max-w-md animate-in fade-in slide-in-from-bottom-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-3xl font-serif w-full border-b border-border focus:border-primary outline-none bg-transparent"
                  placeholder="Your Name"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 text-sm bg-hover border border-border rounded-xl outline-none focus:border-primary resize-none h-24"
                  placeholder="Your olfactory signature..."
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="bg-primary text-surface px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="text-xs text-secondary px-4 py-2 hover:text-primary">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-4xl font-serif text-primary mb-2">
                  {profile?.display_name || user.email?.split('@')[0]}
                </h1>
                <p className="text-secondary max-w-lg leading-relaxed">{profile?.bio || "No olfactory bio yet."}</p>
                {profile?.signature_scent && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-hover border border-border rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Signature:</span>
                    <span className="text-xs font-medium text-primary">{profile.signature_scent.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-6 mt-12">
        
        {/* Analytics Dashboard (Always show if data exists) */}
        {collection.length > 0 && (
          <WardrobeAnalytics collection={collection} />
        )}

        {/* Recommendations Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif">Personalized Recommendations</h2>
            <Link
              href="/recommendations/all"
              className="text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors"
            >
              See All →
            </Link>
          </div>
          <RecommendationsList
            vibeTags={profile?.vibe_tags || []}
            bestSeason={profile?.best_season || 'all'}
          />
        </div>

        {/* TABS */}
        <div className="flex gap-8 border-b border-stone-200 mb-8">
          {['collection', 'mixes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {tab === 'collection' ? `Wardrobe (${collection.length})` : `Lab Creations (${savedMixes.length})`}
            </button>
          ))}
        </div>

        {/* GRID: COLLECTION */}
        {activeTab === 'collection' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {collection.map((item) => (
              <Link key={item.id} href={`/perfume/${item.perfume.id}`} className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-40 flex items-center justify-center p-2 mb-4 bg-hover rounded-lg group-hover:bg-surface transition-colors">
                  <img src={item.perfume.image_url} className="h-full object-contain mix-blend-multiply" />
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-secondary truncate">{item.perfume.brand?.name}</div>
                  <div className="font-serif text-sm text-primary truncate">{item.perfume.name}</div>
                </div>
              </Link>
            ))}
            {collection.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl">
                <p className="text-secondary mb-4">Your shelf is empty.</p>
                <Link href="/" className="bg-primary text-surface px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-secondary">Browse Perfumes</Link>
              </div>
            )}
          </div>
        )}

        {/* GRID: MIXES */}
        {activeTab === 'mixes' && (
          <div className="grid md:grid-cols-2 gap-6">
            {savedMixes.map((mix) => (
              <div key={mix.id} className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-6">
                <div className="flex -space-x-4">
                  <img src={mix.base?.image_url} className="w-16 h-16 rounded-full border-4 border-surface bg-hover object-cover" />
                  <img src={mix.top?.image_url} className="w-16 h-16 rounded-full border-4 border-surface bg-hover object-cover" />
                </div>
                <div>
                  <h4 className="font-serif text-lg">{mix.mix_name}</h4>
                  <p className="text-xs text-stone-500">{mix.mix_ratio}% {mix.base?.name} + {100 - mix.mix_ratio}% {mix.top?.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}