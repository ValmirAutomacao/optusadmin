
import React from 'react';

const MobilePWA: React.FC = () => {
  return (
    <div className="bg-serious-50 min-h-screen pb-32">
      {/* Header - Reference Image 1 mobile part */}
      <header className="px-6 pt-8 pb-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-500/10 p-0.5 bg-brand-50">
            <img src="https://picsum.photos/seed/shuza/48/48" className="w-full h-full rounded-full object-cover" alt="User" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Good Morning,</p>
            <h1 className="text-lg font-bold text-serious-900">Mr Shuza 👋</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <PWAIconButton icon="notifications" />
          <PWAIconButton icon="search" />
        </div>
      </header>

      <main className="px-6 pt-6 space-y-8">
        {/* Quick Actions - The Orange/White Cards */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-500 p-6 rounded-[2rem] text-white shadow-xl shadow-brand-500/20 active:scale-95 transition-transform cursor-pointer">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <span className="material-icons-round">add_circle</span>
              </div>
              <p className="font-bold text-sm">New Booking</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 text-brand-500">
                <span className="material-icons-round">calendar_today</span>
              </div>
              <p className="font-bold text-sm text-serious-900">View Calendar</p>
            </div>
          </div>
        </section>

        {/* Horizontal Performance Stats */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Today's Performance</h2>
             <span className="text-brand-500 text-[10px] font-bold flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" /> LIVE
             </span>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6">
            <StatsMini label="Sessions" value="24k" progress={65} />
            <StatsMini label="Bounce Rate" value="36.4%" progress={36} />
            <StatsMini label="Avg. Duration" value="00:18" progress={20} />
          </div>
        </section>

        {/* Schedule List */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Today's Schedule</h2>
            <button className="text-brand-500 text-xs font-bold">See All</button>
          </div>
          <div className="space-y-4">
            <ScheduleItem 
              time="09:00" 
              period="AM" 
              title="Consultation Session" 
              client="David Miller" 
              duration="45 min" 
              source="Direct Link"
            />
            <ScheduleItem 
              time="11:30" 
              period="AM" 
              title="Service Maintenance" 
              client="Sarah Jenkins" 
              duration="60 min" 
              source="Organic Search"
            />
            <ScheduleItem 
              time="02:15" 
              period="PM" 
              title="Strategy Workshop" 
              client="Alex Rivera" 
              duration="90 min" 
              source="Referral"
            />
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button className="fixed right-6 bottom-32 w-16 h-16 bg-brand-500 text-white rounded-full shadow-2xl shadow-brand-500/40 flex items-center justify-center active:scale-90 transition-transform z-50">
        <span className="material-icons-round text-3xl">add</span>
      </button>

      {/* PWA Tab Bar - Dark variant from Reference Image 1 mobile */}
      <nav className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-4 z-50">
        <div className="max-w-md mx-auto glass-dark text-white p-3 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
          <div className="w-12 h-12 bg-brand-500 rounded-3xl flex items-center justify-center">
            <span className="material-icons-round">grid_view</span>
          </div>
          <span className="material-icons-round text-slate-400 p-3">calendar_month</span>
          <span className="material-icons-round text-slate-400 p-3">analytics</span>
          <span className="material-icons-round text-slate-400 p-3">group</span>
          <span className="material-icons-round text-slate-400 p-3">settings</span>
        </div>
      </nav>
    </div>
  );
};

const PWAIconButton = ({ icon }: { icon: string }) => (
  <button className="w-11 h-11 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm active:bg-slate-50">
    <span className="material-icons-round">{icon}</span>
  </button>
);

const StatsMini = ({ label, value, progress }: any) => (
  <div className="min-w-[140px] bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">{label}</p>
    <p className="text-xl font-bold text-serious-900">{value}</p>
    <div className="mt-3 h-1 bg-slate-50 rounded-full overflow-hidden">
      <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

const ScheduleItem = ({ time, period, title, client, duration, source }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 flex gap-4 active:bg-slate-50 transition-colors">
    <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-slate-50 pr-4">
      <span className="text-sm font-bold text-serious-900">{time}</span>
      <span className="text-[9px] font-bold text-slate-400">{period}</span>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-serious-900 text-sm">{title}</h4>
        <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg">{duration}</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">Client: {client}</p>
      <div className="flex items-center gap-2 mt-3">
        <div className="w-5 h-5 rounded-full bg-slate-100" />
        <span className="text-[10px] text-slate-400 italic">Scheduled via {source}</span>
      </div>
    </div>
  </div>
);

export default MobilePWA;
