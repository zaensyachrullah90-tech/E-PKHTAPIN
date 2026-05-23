import React from 'react';
import { Trophy } from 'lucide-react';

export default function Ranking({ rankingData }) {
  return (
    <div className="space-y-5 animate-in fade-in max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <Trophy className="w-48 h-48 absolute right-0 top-0 opacity-20" />
        <h3 className="font-black text-3xl relative z-10">Klasemen Bulan Ini</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rankingData.map((u, i) => (
          <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between hover:shadow-md cursor-pointer">
            <div className="flex items-center w-2/3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl mr-5 border-4 ${i === 0 ? 'bg-yellow-400 text-white border-yellow-200' : 'bg-gray-300 text-gray-700'}`}>
                {i + 1}
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-lg">{String(u.nama || '')}</h4>
                <p className="text-sm font-medium text-gray-500">{String(u.level || '')}</p>
              </div>
            </div>
            <div className="text-right w-1/3">
              <p className="font-black text-blue-600 text-3xl">{u.poin}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Poin</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}