import React, { useEffect, useState } from 'react';
import { Smartphone, Monitor, AlertTriangle, Wifi } from 'lucide-react';

const MobileRestriction: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'Windows Phone'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isSmallScreen = window.innerWidth < 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center p-4 z-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-white rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/2 w-20 h-20 bg-white rounded-full opacity-10 animate-bounce"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20 relative z-10">
        <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Доступ ограничен
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          Вход с мобильных устройств запрещен
        </p>
        
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <p className="text-red-700 font-bold text-lg">
              CHRONOS недоступен на мобильных устройствах
            </p>
          </div>
          <p className="text-red-600 font-medium">
            Пожалуйста, используйте компьютер или ноутбук для входа в систему
          </p>
        </div>
        
        <div className="text-left space-y-4 bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-6 h-6 text-blue-600" />
            <p className="font-bold text-gray-800 text-lg">Для работы с системой требуется:</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-gray-700">Компьютер или ноутбук</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-700">Браузер Chrome, Firefox или Safari</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <Wifi className="w-4 h-4 text-purple-500" />
              <span className="font-medium text-gray-700">Стабильное интернет-соединение</span>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-blue-700 text-sm font-medium">
            Система учета времени оптимизирована для работы на больших экранах
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileRestriction;