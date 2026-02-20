import { App, APPS } from '../data/apps';

interface HomeScreenProps {
  onOpenApp: (app: App) => void;
  currentUser?: { role?: string };
}

export const HomeScreen = ({ onOpenApp, currentUser }: HomeScreenProps) => {
  // Filter apps based on user role
  const isTeacher = currentUser?.role === 'teacher';
  
  const getVisibleApps = (apps: App[]) => {
    if (isTeacher) {
      // Teachers only see teacher-only apps (no 'student' role apps)
      return apps.filter(app => app.role === 'teacher' && !app.comingSoon);
    } else {
      // Students see all apps except teacher-only apps
      return apps.filter(app => app.role !== 'teacher' && !app.comingSoon);
    }
  };

  const getComingSoonApps = (apps: App[]) => {
    if (isTeacher) {
      return apps.filter(app => app.role === 'teacher' && app.comingSoon);
    } else {
      return apps.filter(app => app.role !== 'teacher' && app.comingSoon);
    }
  };

  const availableApps = getVisibleApps(APPS);
  const comingSoonApps = getComingSoonApps(APPS);

  return (
    <div className="w-full h-full bg-black flex flex-col">
      {/* All Apps Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-5 gap-6">
          {/* Available Apps */}
          {availableApps.map((app) => (
            <div
              key={app.id}
              onClick={() => onOpenApp(app)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl cursor-pointer transition-transform duration-200 active:scale-90 hover:scale-105"
            >
              <div className={`${app.color} p-6 rounded-2xl text-white flex items-center justify-center`}>
                {app.icon}
              </div>
              <span className="text-gray-300 text-center text-sm font-medium break-words max-w-full">
                {app.name}
              </span>
            </div>
          ))}

          {/* Coming Soon Apps */}
          {comingSoonApps.map((app) => (
            <div
              key={app.id}
              className="flex flex-col items-center gap-3 p-4 rounded-xl relative opacity-50 cursor-not-allowed"
            >
              <div className={`${app.color} p-6 rounded-2xl text-white flex items-center justify-center`}>
                {app.icon}
              </div>
              <span className="text-gray-400 text-center text-sm font-medium break-words max-w-full">
                {app.name}
              </span>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-xl">
                <span className="text-white text-xs font-bold bg-gray-800 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
