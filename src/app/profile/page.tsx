'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import WardrobeAnalytics from '@/components/WardrobeAnalytics';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'collection' | 'mixes'>('mixes');
  const [savedMixes, setSavedMixes] = useState<any[]>([]);
  const [collection, setCollection] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Profile State
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // 1. Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 2. Fetch User Data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const supabase = createClient();
      
      // A. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
      }

      // B. Fetch Saved Mixes
      const { data: mixes } = await supabase
        .from('saved_mixes')
        .select(`
          *,
          base_perfume:perfumes!saved_mixes_base_perfume_id_fkey(name, brand:brands(name), image_url),
          top_perfume:perfumes!saved_mixes_top_perfume_id_fkey(name, brand:brands(name), image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedMixes(mixes || []);

      // C. Fetch Wardrobe (Collection)
      const { data: collectionData } = await supabase
        .from('user_collections')
        .select(`
          id,
          perfume:perfumes(id, name, image_url, brand:brands(name))
        `)
        .eq('user_id', user.id);
        
      setCollection(collectionData || []);
      setLoadingData(false);
    };

    fetchData();
  }, [user]);

  // 3. Save Profile Changes
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const supabase = createClient();

    const updates = {
      id: user.id,
      display_name: displayName,
      bio: bio,
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (!error) {
      setProfile(updates);
      setIsEditing(false);
    } else {
      alert('Failed to save profile');
    }
    setSavingProfile(false);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans pb-24">
      
      {/* Header / Profile Card */}
      <div className="bg-stone-50 border-b border-stone-200 px-6 py-12 mb-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Member Profile</div>
            
            {isEditing ? (
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Display Name</label>
                    <input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-2 border-b border-stone-200 focus:border-stone-900 outline-none font-serif text-xl"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Bio / Signature</label>
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full p-2 border border-stone-200 rounded-lg focus:border-stone-900 outline-none text-sm h-20 resize-none"
                      placeholder="Favorite notes, scent memories..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsEditing(false)} className="text-xs text-stone-500 hover:text-stone-900 px-3 py-2">Cancel</button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition"
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-serif text-4xl text-stone-900 mb-2">
                  {user.display_name || profile?.display_name || user.email?.split('@')[0]}'s Shelf
                </h1>
                <p className="text-stone-500 text-sm max-w-lg italic">
                  {profile?.bio || "No bio yet."}
                </p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 border-b border-dashed border-stone-300 hover:border-stone-900 pb-0.5 transition-all"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 self-start md:self-center">
            ← Back to Shop
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        
        {/* Tabs */}
        <div className="flex gap-8 border-b border-stone-200 mb-12">
          <button 
            onClick={() => setActiveTab('mixes')}
            className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'mixes' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Lab Creations ({savedMixes.length})
          </button>
          <button 
            onClick={() => setActiveTab('collection')}
            className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'collection' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
          >
            My Wardrobe ({collection.length})
          </button>
        </div>

        {/* Content: MIXES */}
        {activeTab === 'mixes' && (
          <div className="grid md:grid-cols-2 gap-6">
            {savedMixes.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                <p className="text-stone-400 italic mb-4">You haven't created any mixes yet.</p>
                <Link href="/layering" className="bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition">
                  Go to Lab
                </Link>
              </div>
            ) : (
              savedMixes.map((mix) => (
                <div key={mix.id} className="border border-stone-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-white group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Custom Blend</div>
                      <h3 className="font-serif text-2xl text-stone-900">{mix.mix_name}</h3>
                    </div>
                    <div className="text-xs font-bold bg-stone-100 px-2 py-1 rounded text-stone-600">
                      {new Date(mix.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* The Mix Visual */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 text-center">
                      <div className="h-24 mb-2 flex items-center justify-center">
                        <img src={mix.base_perfume?.image_url} className="h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="text-[9px] uppercase font-bold text-stone-400">{mix.base_perfume?.brand?.name}</div>
                      <div className="text-xs font-serif truncate">{mix.base_perfume?.name}</div>
                      <div className="text-[10px] font-bold text-stone-500 mt-1">{mix.mix_ratio}%</div>
                    </div>

                    <div className="text-stone-300 font-serif italic text-2xl">+</div>

                    <div className="flex-1 text-center">
                      <div className="h-24 mb-2 flex items-center justify-center">
                        <img src={mix.top_perfume?.image_url} className="h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="text-[9px] uppercase font-bold text-stone-400">{mix.top_perfume?.brand?.name}</div>
                      <div className="text-xs font-serif truncate">{mix.top_perfume?.name}</div>
                      <div className="text-[10px] font-bold text-stone-500 mt-1">{100 - mix.mix_ratio}%</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Content: WARDROBE */}
        {activeTab === 'collection' && (
          <>
            {/* Analytics Module */}
            {collection.length > 0 && (
              <WardrobeAnalytics collection={collection} />
            )}
            
            {collection.length === 0 ? (
              <div className="text-center py-20 bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                <p className="text-stone-400 italic mb-4">Your wardrobe is empty.</p>
                <Link href="/" className="bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition">
                  Browse Perfumes
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {collection.map((item: any) => (
                  <Link key={item.id} href={`/perfume/${item.perfume.id}`} className="group bg-white border border-stone-200 rounded-xl p-4 hover:shadow-lg transition-all">
                    <div className="h-40 mb-4 flex items-center justify-center">
                      <img src={item.perfume.image_url} className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700" />
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate">{item.perfume.brand?.name}</div>
                      <div className="font-serif text-sm text-stone-900 truncate">{item.perfume.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}