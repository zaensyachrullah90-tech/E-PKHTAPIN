import React from 'react';
import { 
  ChevronLeft, Share2, Target, UsersIcon, UserSquare, CheckSquare, 
  Plus, ChevronRight, BarChart2, CheckCircle, AlertCircle, Calendar, 
  LinkIcon, Edit 
} from 'lucide-react';

export default function Tugas(props) {
  // Pecah props agar lebih mudah dibaca
  const {
    tugasTab, setTugasTab, selectedTaskView, setSelectedTaskView,
    selectedVoteView, setSelectedVoteView, selectedJadwalView, setSelectedJadwalView,
    isKorkab, isKorcam, safeTasksData, safeVotesData, safeJadwalData,
    currentUserData, activeSdmList, showToast, dbUpdate,
    setShowTambahTugasModal, setShowLaporTugasModal, setSelectedTugasToLapor,
    setShowTambahVoteModal, selectedVote, setSelectedVote,
    setShowTambahJadwalModal, setShowIsiJadwalModal
  } = props;

  // --- RENDER 1: DAFTAR TUGAS ---
  const renderDaftar = () => {
    if (selectedTaskView) {
      return (
        <div className="space-y-5 animate-in fade-in">
          <button onClick={() => setSelectedTaskView(null)} className="flex items-center text-blue-600 font-bold bg-white border px-5 py-3 rounded-xl hover:bg-blue-50 shadow-sm w-fit cursor-pointer"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali</button>
          <div className="bg-white border-t-8 border-t-blue-500 p-8 rounded-3xl shadow-md border-x border-b">
            <h3 className="font-black text-gray-800 text-2xl mb-5">{String(selectedTaskView.title || '')}</h3>
            <div className="bg-blue-50 p-6 rounded-2xl mb-8 text-base text-gray-700 border">
              <p>{String(selectedTaskView.desc || '')}</p>
            </div>
            <button onClick={() => { setSelectedTugasToLapor(selectedTaskView); setShowLaporTugasModal(true); }} className="w-full md:w-1/2 py-4 bg-blue-600 text-white rounded-xl text-base font-black flex items-center justify-center hover:bg-blue-700 shadow-lg cursor-pointer">
              <CheckSquare className="w-6 h-6 mr-3"/> Lapor Kegiatan
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        {isKorkab && (<button onClick={() => setShowTambahTugasModal(true)} className="py-4 w-full bg-blue-50 border text-blue-700 rounded-3xl text-base font-bold shadow-sm hover:bg-blue-100 cursor-pointer"><Plus className="w-6 h-6 inline mr-2" /> Buat Tugas</button>)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeTasksData.map(task => (
            <div key={task.id} onClick={() => setSelectedTaskView(task)} className="bg-white border-l-4 border-blue-500 p-6 rounded-3xl shadow-sm cursor-pointer hover:shadow-md min-h-[10rem]">
              <div>
                <h4 className="font-black text-gray-800 text-lg mb-2">{String(task.title || '')}</h4>
                <p className="text-sm text-gray-500">{String(task.desc || '')}</p>
              </div>
              <div className="flex justify-end mt-4"><ChevronRight className="w-6 h-6 text-gray-300" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDER 2: PROGRES TUGAS ---
  const renderProgres = () => {
    if (selectedTaskView) {
      const currentProgress = safeTasksData.find(t => String(t.id) === String(selectedTaskView.id)) || { target: 0, realisasi: 0, userRealisasi: {} };
      const globalPct = Number(currentProgress.target) > 0 ? Math.min(100, Math.round((Number(currentProgress.realisasi) / Number(currentProgress.target)) * 100)) : 0;
      return (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setSelectedTaskView(null)} className="flex items-center text-indigo-600 font-bold bg-white border border-indigo-200 px-5 py-3 rounded-xl hover:bg-indigo-50 shadow-sm cursor-pointer"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali</button>
            {isKorkab && (<button onClick={() => showToast(`Link Tersalin!`)} className="flex items-center text-indigo-700 font-bold bg-indigo-50 px-5 py-3 rounded-xl hover:bg-indigo-100 border shadow-sm cursor-pointer"><Share2 className="w-5 h-5 mr-2" /> Bagikan</button>)}
          </div>
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
            <Target className="w-64 h-64 absolute -top-10 -right-10 p-4 opacity-10" />
            <h4 className="font-black text-3xl mb-2 relative z-10">Progres Real-Time</h4>
            <div className="grid grid-cols-3 gap-4 mt-3 relative z-10">
              <div className="bg-white/10 rounded-2xl p-5 text-center"><p className="text-xs text-indigo-200 mb-2 uppercase font-bold">Target</p><p className="text-4xl font-black">{Number(currentProgress.target || 0)}</p></div>
              <div className="bg-white/10 rounded-2xl p-5 text-center"><p className="text-xs text-indigo-200 mb-2 uppercase font-bold">Realisasi</p><p className="text-4xl font-black text-green-300">{Number(currentProgress.realisasi || 0)}</p></div>
              <div className="bg-white/20 rounded-2xl p-5 text-center"><p className="text-xs text-white mb-2 uppercase font-bold">Capaian</p><p className="text-4xl font-black text-yellow-300">{globalPct}%</p></div>
            </div>
            <div className="mt-8 w-full bg-black/30 rounded-full h-4 relative z-10 overflow-hidden"><div className="bg-yellow-400 h-4 rounded-full" style={{width: `${globalPct}%`}}></div></div>
          </div>
          <div className="space-y-4 pt-6">
            <h5 className="font-black text-base text-gray-800 mb-5 border-b pb-3"><UsersIcon className="w-5 h-5 inline mr-3 text-indigo-600"/> Rincian Laporan</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSdmList.map(sdm => {
                const userVal = Number((currentProgress.userRealisasi || {})[sdm.nama] || 0);
                const targetPerUser = Math.round(Number(currentProgress.target) / activeSdmList.length) || 0;
                const pct = targetPerUser > 0 ? Math.round((userVal/targetPerUser)*100) : 0;
                if (!isKorkab && !isKorcam && String(currentUserData?.nama) !== String(sdm.nama)) return null;
                return (
                  <div key={sdm.id} className="bg-white p-6 rounded-3xl shadow-sm border">
                    <div className="flex justify-between items-start mb-4"><h4 className="font-bold text-gray-800 text-base"><UserSquare className="w-5 h-5 inline mr-2 text-gray-400"/> {String(sdm.nama || '')}</h4></div>
                    <div className="flex justify-between items-end mt-5 mb-3">
                      <div className="text-sm font-medium"><span className="text-gray-500">Target: {targetPerUser}</span> | <span className="text-gray-500">Realisasi:</span> <span className={`font-black ml-1 text-lg ${pct >= 100 ? 'text-green-600' : 'text-indigo-600'}`}>{userVal}</span></div>
                      <span className={`text-3xl font-black ${pct >= 100 ? 'text-green-500' : 'text-indigo-500'}`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className={`h-3 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{width: `${Math.min(100, pct)}%`}}></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeTasksData.map(task => (
            <div key={task.id} onClick={() => setSelectedTaskView(task)} className="bg-white border-l-4 border-blue-500 p-6 rounded-3xl shadow-sm cursor-pointer hover:shadow-md min-h-[10rem]">
              <div><h4 className="font-black text-gray-800 text-lg mb-2">{String(task.title || '')}</h4><p className="text-sm text-gray-500">Ketuk untuk rekap progres live.</p></div>
              <div className="flex justify-end mt-4"><BarChart2 className="w-7 h-7 text-indigo-200" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDER 3: VOTING ---
  const renderVote = () => {
    if (selectedVoteView) {
      const hasilVoting = selectedVoteView.results || {};
      const currentVoters = selectedVoteView.voters || {};
      const totalVotes = Object.values(hasilVoting).reduce((a, b) => a + Number(b), 0);
      const currentUserHasVoted = Object.keys(currentVoters).includes(String(currentUserData?.nama));
      const listSudahVote = Object.keys(currentVoters);
      const listBelumVote = activeSdmList.filter(sdm => !listSudahVote.includes(String(sdm.nama))).map(sdm => String(sdm.nama));

      const handleSubmitVote = async () => {
         if(selectedVote) {
           const newVotes = { ...hasilVoting, [selectedVote]: (Number(hasilVoting[selectedVote]) || 0) + 1 };
           const newVotersList = { ...currentVoters, [String(currentUserData?.nama)]: selectedVote };
           await dbUpdate('voteData', selectedVoteView.id, { results: newVotes, voters: newVotersList });
         }
      };

      return (
        <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto">
          <button onClick={() => setSelectedVoteView(null)} className="flex items-center text-purple-600 font-bold bg-white border px-5 py-3 rounded-xl hover:bg-purple-50 w-fit cursor-pointer"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali</button>
          <div className="bg-white p-8 rounded-3xl shadow-md border">
            <h4 className="font-black text-gray-800 text-2xl mb-6">{String(selectedVoteView.title || '')}</h4>
            <p className="text-base text-gray-600 mb-8 bg-purple-50 p-5 rounded-2xl border">{String(selectedVoteView.desc || '')}</p>
            
            {!currentUserHasVoted && (
              <div className="space-y-4">
                <h5 className="font-bold text-gray-800 text-base mb-4">Berikan Suara Anda:</h5>
                {(Array.isArray(selectedVoteView.options) ? selectedVoteView.options : []).map((opsi, i) => (
                  <label key={i} className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer ${selectedVote === opsi ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <input type="radio" name="vote_makan" className="mr-4 w-6 h-6 text-purple-600 cursor-pointer" onChange={() => setSelectedVote(opsi)} />
                    <span className="text-base font-bold text-gray-700">{String(opsi || '')}</span>
                  </label>
                ))}
                <button onClick={handleSubmitVote} disabled={!selectedVote} className={`w-full mt-8 py-5 rounded-2xl font-black text-lg text-white shadow-lg cursor-pointer ${selectedVote ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'}`}>Submit</button>
              </div>
            )}
            
            {(isKorkab || isKorcam || currentUserHasVoted) && (
              <div className="space-y-5 mt-8 pt-8 border-t">
                <div className="bg-gray-50 p-6 rounded-3xl border shadow-inner">
                  <h5 className="text-sm font-black text-gray-500 mb-6 uppercase flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-purple-500"/> Hasil Polling Live DB</h5>
                  <div className="space-y-6 mb-8">
                    {(Array.isArray(selectedVoteView.options) ? selectedVoteView.options : []).map((opsi, i) => {
                      const v = Number(hasilVoting[opsi]) || 0;
                      const pct = totalVotes > 0 ? Math.round((v/totalVotes)*100) : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-base mb-2"><span className="font-bold text-gray-700">{String(opsi || '')} <span className="text-gray-400">({v} Suara)</span></span><span className="font-black text-purple-700">{pct}%</span></div>
                          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden"><div className="bg-purple-500 h-4 rounded-full" style={{width: `${pct}%`}}></div></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                    <div><h6 className="text-xs font-black text-green-600 uppercase mb-3 flex items-center"><CheckCircle className="w-4 h-4 mr-1.5"/> Sudah Vote ({listSudahVote.length})</h6><div className="flex flex-wrap gap-2">{listSudahVote.map(n => <span key={n} className="bg-green-50 text-green-700 px-2.5 py-1.5 rounded border text-[10px] font-bold">{String(n)}</span>)}</div></div>
                    <div><h6 className="text-xs font-black text-red-600 uppercase mb-3 flex items-center"><AlertCircle className="w-4 h-4 mr-1.5"/> Belum Vote ({listBelumVote.length})</h6><div className="flex flex-wrap gap-2">{listBelumVote.map(n => <span key={n} className="bg-red-50 text-red-700 px-2.5 py-1.5 rounded border text-[10px] font-bold">{String(n)}</span>)}</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        {isKorkab && <button onClick={() => setShowTambahVoteModal(true)} className="w-full py-4 bg-purple-600 text-white rounded-3xl font-bold mb-3 shadow-lg hover:bg-purple-700 text-lg cursor-pointer"><Plus className="w-6 h-6 inline mr-2" /> Buat Polling Real-Time</button>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeVotesData.map(vote => (
            <div key={vote.id} onClick={() => setSelectedVoteView(vote)} className="bg-white border-l-4 border-purple-500 p-6 rounded-3xl shadow-sm cursor-pointer hover:shadow-md min-h-[10rem]">
              <div><h4 className="font-bold text-gray-800 text-lg mb-2">{String(vote.title || '')}</h4><p className="text-sm text-gray-500 flex items-center"><BarChart2 className="w-4 h-4 mr-2 text-purple-400"/> {Object.keys(vote.voters || {}).includes(String(currentUserData?.nama)) ? 'Ketuk lihat hasil live' : 'Ketuk untuk partisipasi'}</p></div>
              <div className="flex justify-end mt-4"><ChevronRight className="w-6 h-6 text-gray-300" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDER 4: JADWAL KEGIATAN ---
  const renderJadwal = () => {
    if (selectedJadwalView) {
      const entries = selectedJadwalView.entries || {};
      const allSdmNames = activeSdmList.map(s => s.nama);
      const sdmWhoFilled = Object.keys(entries);
      const sdmNotFilled = allSdmNames.filter(name => !sdmWhoFilled.includes(name) && name !== 'Admin Master');
      const publicLink = `${window.location.origin}${window.location.pathname}?share=jadwal&id=${selectedJadwalView.id}`;
      
      return (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between">
            <button onClick={() => setSelectedJadwalView(null)} className="flex items-center text-emerald-600 font-bold bg-white border px-5 py-3 rounded-xl shadow-sm cursor-pointer"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali</button>
            {isKorkab && (<button onClick={() => { navigator.clipboard.writeText(publicLink); showToast("Link Disalin!"); }} className="flex items-center text-blue-700 font-bold bg-blue-50 px-5 py-3 rounded-xl border border-blue-200 shadow-sm cursor-pointer"><LinkIcon className="w-5 h-5 mr-2" /> Bagikan Link Publik</button>)}
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-md border">
            <div className="flex flex-col md:flex-row justify-between mb-6 border-b pb-6 gap-4">
              <div><h4 className="font-black text-2xl text-emerald-700">{String(selectedJadwalView.title || '')}</h4><p className="text-sm text-gray-500 font-medium mt-2">{String(selectedJadwalView.desc || '')}</p></div>
              <button onClick={() => setShowIsiJadwalModal(true)} className="py-3 px-6 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-700 whitespace-nowrap cursor-pointer"><Edit className="w-4 h-4 inline mr-2"/> Isi Jadwal Saya</button>
            </div>
            <div className="bg-gray-50 rounded-2xl border shadow-inner">
              <div className="p-5 border-b bg-white"><h5 className="font-black text-gray-700 text-sm flex items-center"><UsersIcon className="w-5 h-5 mr-2 text-emerald-500"/> Rekap Jadwal ({sdmWhoFilled.length} Terisi)</h5></div>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-gray-100 border-b text-gray-600">
                    <tr>
                      <th className="p-4 text-xs font-black uppercase">Nama SDM</th>
                      <th className="p-4 text-xs font-black uppercase">Tgl & Jam</th>
                      <th className="p-4 text-xs font-black uppercase">Lokasi</th>
                      <th className="p-4 text-xs font-black uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {sdmWhoFilled.map((n, idx) => {
                      const data = entries[n];
                      return (
                        <tr key={idx} className="hover:bg-emerald-50/30">
                          <td className="p-4 font-bold text-gray-800 flex items-center"><div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-3 text-xs shrink-0">{String(n).charAt(0)}</div>{String(n)}</td>
                          <td className="p-4 text-sm font-medium text-gray-600"><span className="block font-bold">{String(data.date || '-')}</span>{String(data.time || '-')}</td>
                          <td className="p-4 text-sm text-emerald-700 font-bold">{String(data.kecamatan || '-')} <span className="text-gray-500 font-medium block">{String(data.desa || '-')}</span></td>
                          <td className="p-4 text-sm text-gray-600">{String(data.ket || '-')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 bg-red-50 rounded-2xl p-6 border border-red-100">
              <h6 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center"><AlertCircle className="w-4 h-4 mr-1.5"/> Belum Mengisi ({sdmNotFilled.length})</h6>
              <div className="flex flex-wrap gap-2">
                {sdmNotFilled.length > 0 ? sdmNotFilled.map(name => <span key={name} className="bg-white text-red-700 px-3 py-2 rounded-lg border border-red-200 text-xs font-bold shadow-sm">{String(name)}</span>) : <span className="text-xs text-green-600 font-bold">Semua sudah mengisi.</span>}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        {isKorkab && <button onClick={() => setShowTambahJadwalModal(true)} className="w-full py-4 bg-emerald-600 text-white rounded-3xl font-bold mb-3 shadow-lg hover:bg-emerald-700 flex items-center justify-center text-lg cursor-pointer"><Plus className="w-6 h-6 inline mr-2" /> Buat Form Jadwal Kegiatan Baru</button>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeJadwalData.map(jdwl => (
            <div key={jdwl.id} onClick={() => setSelectedJadwalView(jdwl)} className="bg-white border-l-4 border-emerald-500 p-6 rounded-3xl shadow-sm cursor-pointer hover:shadow-md min-h-[10rem] relative z-20">
              <div><h4 className="font-bold text-gray-800 text-lg mb-2">{String(jdwl.title || '')}</h4><p className="text-sm text-gray-500 flex items-center font-medium"><Calendar className="w-4 h-4 mr-2 text-emerald-500"/> {Object.keys(jdwl.entries || {}).length} SDM telah mengisi</p></div>
              <div className="flex justify-end mt-4"><ChevronRight className="w-6 h-6 text-gray-300" /></div>
            </div>
          ))}
          {safeJadwalData.length === 0 && <p className="text-center text-gray-500 py-10 italic col-span-full">Belum ada form jadwal.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Tab Navigasi Atas */}
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border overflow-x-auto">
        <button onClick={() => {setTugasTab('daftar'); setSelectedTaskView(null); setSelectedVoteView(null); setSelectedJadwalView(null);}} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer ${tugasTab === 'daftar' && !selectedTaskView && !selectedVoteView && !selectedJadwalView ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Daftar Tugas</button>
        <button onClick={() => {setTugasTab('progres'); setSelectedTaskView(null); setSelectedVoteView(null); setSelectedJadwalView(null);}} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer ${tugasTab === 'progres' && !selectedTaskView && !selectedVoteView && !selectedJadwalView ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Progres Data</button>
        <button onClick={() => {setTugasTab('vote'); setSelectedTaskView(null); setSelectedVoteView(null); setSelectedJadwalView(null);}} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer ${tugasTab === 'vote' && !selectedVoteView ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>Voting Aktif</button>
        <button onClick={() => {setTugasTab('jadwal'); setSelectedTaskView(null); setSelectedVoteView(null); setSelectedJadwalView(null);}} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer ${tugasTab === 'jadwal' && !selectedJadwalView ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500'}`}>Jadwal Kegiatan</button>
      </div>

      {/* Konten Tab yang Terpilih */}
      {tugasTab === 'daftar' && renderDaftar()}
      {tugasTab === 'progres' && renderProgres()}
      {tugasTab === 'vote' && renderVote()}
      {tugasTab === 'jadwal' && renderJadwal()}
    </div>
  );
}