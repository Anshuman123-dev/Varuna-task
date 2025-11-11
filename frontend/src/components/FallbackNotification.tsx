import { useEffect, useState } from 'react';

interface FallbackNotificationProps {
  show: boolean;
}

export default function FallbackNotification({ show }: FallbackNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h4 className="font-bold text-yellow-900 mb-1">
              Backend Connection Timeout
            </h4>
            <p className="text-sm text-yellow-800">
              Unable to connect to backend after 10 seconds. Displaying random fallback data for demonstration purposes.
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-yellow-600 hover:text-yellow-800 font-bold"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
