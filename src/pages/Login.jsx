import React from 'react';
import { Shield, AlertCircle, UserSquare, Settings, LogIn } from 'lucide-react';

export default function Login({ 
  loginUsername, 
  setLoginUsername, 
  loginPassword, 
  setLoginPassword, 
  loginError, 
  handleLoginSubmit 
}) {
  
  const inputClass = "w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-800";

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex justify-center items-center">
      <div className="flex w-full min-h-screen bg-white shadow-2xl overflow-hidden">
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
          <Shield className="w-40 h-40 mb-10 opacity-90 drop-shadow-2xl relative z-10"/>
          <h1 className="text-5xl font-black mb-6 tracking-tight relative z-10 text-center leading-tight">
            Sistem Terpadu<br/>PKH Tapin
          </h1>
          <p className="text-xl text-blue-200 text-center max-w-lg leading-relaxed relative z-10 font-medium">
            Platform integrasi data, pelaporan, dan monitoring SDM Program Keluarga Harapan secara Real-Time Cloud.
          </p>
        </div>
        
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-gray-50 relative">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
            <div className="text-center mb-10 lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">Selamat Datang 👋</h2>
              <p className="text-sm text-gray-500 font-medium">Masuk menggunakan NIK & Sandi Anda.</p>
            </div>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 border border-red-200 flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0" /> {String(loginError)}
              </div>
            )}
            
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Username / NIK</label>
                <div className="relative">
                  <UserSquare className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    value={loginUsername} 
                    onChange={e => setLoginUsername(e.target.value)} 
                    type="text" 
                    required 
                    className={`${inputClass} pl-12`} 
                    placeholder="Ketik NIK KTP Anda" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Kata Sandi</label>
                <div className="relative">
                  <Settings className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)} 
                    type="password" 
                    required 
                    className={`${inputClass} pl-12`} 
                    placeholder="••••••••" 
                  />
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-base shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all cursor-pointer">
                <LogIn className="w-5 h-5 mr-2" /> Masuk ke Aplikasi
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}