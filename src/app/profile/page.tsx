'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'collection' | 'mixes'>('mixes');
  const [savedMixes, setSavedMixes] = useState<any[]>([]);
  const [collection, setCollection] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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
      
      // Fetch Saved Mixes
      const { data: mixes } = await supabase
        .from('saved_mixes')
        .select(`
          *,
          base_perfume:perfumes!saved_mixes_base_perfume_id_fkey(name, brand:brands(name), image_url),
          top_perfume:perfumes!saved_mixes_top_perfume_id_fkey(name, brand:brands(name), image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch User Collection
      const { data: userCollection } = await supabase
        .from('user_collections')
        .select(`
          id,
          perfume:perfumes(id, name, image_url, brand:brands(name))
        `)
        .eq('user_id', user.id);

      setSavedMixes(mixes || []);
      setCollection(userCollection || []);
      setLoadingData(false);
    };

    fetchData();
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans pb-24">
      
      {/* Header */}
      <div className="bg-stone-50 border-b border-stone-200 px-6 py-12 mb-12">
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Member Profile</div>
            <h1 className="font-serif text-4xl text-stone-900">{user.email?.split('@')[0]}'s Shelf</h1>
          </div>
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900">
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

                  {/* Actions */}
                  <button className="w-full py-3 border-t border-stone-100 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition">
                    View Details →
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Content: COLLECTION */}
        {activeTab === 'collection' && (
          <>
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