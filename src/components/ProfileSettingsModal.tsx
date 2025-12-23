'use client';

import React, { useState, useEffect } from 'react';
import { Database } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

type ProfileSettingsModalProps = {
  initialDisplayName: string | null;
  initialBio: string | null;
  initialSignatureScentId: string | null;
  collection: any[]; // Using any[] for flexibility, or we can import the strict type
  isOpen: boolean;
  onClose: () => void;
  onSave: (displayName: string, bio: string, signatureScentId: string | null) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
};

export default function ProfileSettingsModal({
  initialDisplayName,
  initialBio,
  initialSignatureScentId,
  collection,
  isOpen,
  onClose,
  onSave,
  isSaving,
  saveError,
  saveSuccess,
}: ProfileSettingsModalProps) {
  const [editedDisplayName, setEditedDisplayName] = useState(initialDisplayName || '');
  const [editedBio, setEditedBio] = useState(initialBio || '');
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(initialSignatureScentId || '');

  // Sync internal state with prop changes when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedDisplayName(initialDisplayName || '');
      setEditedBio(initialBio || '');
      setSelectedSignatureId(initialSignatureScentId || '');
    }
  }, [isOpen, initialDisplayName, initialBio, initialSignatureScentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition"
        >
          ✕
        </button>

        <h2 className="font-serif text-2xl text-stone-900 mb-6">Edit Profile</h2>

        {/* Profile Details Section */}
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={editedDisplayName}
              onChange={(e) => setEditedDisplayName(e.target.value)}
              className="w-full p-2 border border-stone-200 rounded-md focus:ring-0 focus:border-stone-400 outline-none text-sm"
              placeholder="Your display name"
            />
          </div>
          
          <div>
            <label htmlFor="signatureScent" className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Signature Scent</label>
            <select
              id="signatureScent"
              value={selectedSignatureId || ''}
              onChange={(e) => setSelectedSignatureId(e.target.value || null)}
              className="w-full p-2 border border-stone-200 rounded-md focus:ring-0 focus:border-stone-400 outline-none text-sm bg-white"
            >
              <option value="">-- Select from Wardrobe --</option>
              {collection.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.brand?.name})
                </option>
              ))}
            </select>
             <p className="text-[10px] text-stone-400 mt-1">Choose a fragrance from your current collection.</p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Bio</label>
            <textarea
              id="bio"
              value={editedBio}
              onChange={(e) => setEditedBio(e.target.value)}
              rows={4}
              className="w-full p-2 border border-stone-200 rounded-md focus:ring-0 focus:border-stone-400 outline-none text-sm resize-none"
              placeholder="Tell us about yourself"
            ></textarea>
          </div>
          
          {saveError && (
            <p className="text-red-500 text-xs mt-0 p-2 bg-red-50 border border-red-200 rounded-lg">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-green-500 text-xs mt-0 p-2 bg-green-50 border border-green-200 rounded-lg">Profile saved successfully!</p>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose} // Cancel only closes the modal
              className="py-2 px-4 text-sm border border-stone-300 rounded-md hover:bg-stone-100 transition"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedDisplayName, editedBio, selectedSignatureId)}
              disabled={isSaving || !editedDisplayName.trim()}
              className="py-2 px-4 text-sm bg-stone-900 text-white rounded-md hover:bg-stone-700 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}