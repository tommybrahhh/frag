'use client';

export function AuthButtons() {
  return (
    <div className="flex gap-4">
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Login
      </button>
      <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
        Sign Up
      </button>
    </div>
  );
}
