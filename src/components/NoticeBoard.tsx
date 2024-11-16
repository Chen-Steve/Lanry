'use client';

const NoticeBoard = () => {
  return (
    <div className="absolute top-0 right-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] p-[3px] rounded-lg bg-gradient-to-br from-amber-700 to-amber-900">
      <div className="bg-white rounded-lg p-4 min-h-[176px]">
        {/* Important Notice Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Important
          </h3>
          <div className="text-sm text-gray-700">
            &quot;I Became the Admiral of the French Navy&quot; was taken down as requested by Munpia
          </div>
        </div>

        {/* Devlog Section */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Devlog
          </h3>
          <div className="text-sm text-gray-700">
            todo: notification system
            todo: login with discord, google
          </div>
          <div className="text-sm text-gray-700">
             todo: login with discord, google
          </div>
        </div>

        {/* Updates Section */}
        <div>
          <h3 className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Updates
          </h3>
          <div className="text-sm text-gray-700">
            New novels coming next week
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard; 