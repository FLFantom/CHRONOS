import React, { useEffect, useState } from 'react';
import { Smartphone, Monitor, AlertTriangle, Wifi, Shield, Lock, Eye } from 'lucide-react';

const MobileRestriction: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    screenWidth: 0,
    screenHeight: 0,
    deviceType: '',
    browser: ''
  });

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Более точная детекция мобильных устройств
      const mobileKeywords = [
        'Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 
        'Windows Phone', 'Opera Mini', 'IEMobile', 'Mobile Safari'
      ];
      
      const tabletKeywords = ['iPad', 'Android', 'Tablet'];
      
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isTablet = tabletKeywords.some(keyword => userAgent.includes(keyword)) && screenWidth >= 768;
      const isSmallScreen = screenWidth < 1024; // Увеличил минимальное разрешение
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Определение типа устройства
      let deviceType = 'Desktop';
      if (userAgent.includes('iPhone')) deviceType = 'iPhone';
      else if (userAgent.includes('iPad')) deviceType = 'iPad';
      else if (userAgent.includes('Android') && userAgent.includes('Mobile')) deviceType = 'Android Phone';
      else if (userAgent.includes('Android')) deviceType = 'Android Tablet';
      else if (isMobileDevice) deviceType = 'Mobile Device';
      else if (isTablet) deviceType = 'Tablet';
      
      // Определение браузера
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      else if (userAgent.includes('Opera')) browser = 'Opera';
      
      setDeviceInfo({
        userAgent,
        screenWidth,
        screenHeight,
        deviceType,
        browser
      });
      
      // Блокируем если это мобильное устройство, маленький экран или тач-устройство
      const shouldBlock = isMobileDevice || isSmallScreen || (isTouchDevice && !isTablet);
      setIsMobile(shouldBlock);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center p-4 z-50 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-white rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-white rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-36 h-36 bg-white rounded-full opacity-10 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white rounded-full opacity-15 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-white rounded-full opacity-10 animate-bounce"></div>
        
        {/* Floating icons */}
        <div className="absolute top-1/4 left-1/3 animate-float">
          <Shield className="w-8 h-8 text-white opacity-20" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-float-delayed">
          <Lock className="w-6 h-6 text-white opacity-25" />
        </div>
        <div className="absolute top-1/2 right-1/2 animate-float">
          <Eye className="w-7 h-7 text-white opacity-15" />
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-white/30 relative z-10 transform hover:scale-105 transition-all duration-300">
        {/* Enhanced header with gradient */}
        <div className="bg-gradient-to-r from-red-500 to-purple-600 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-50 animate-pulse"></div>
          <Smartphone className="w-12 h-12 text-white relative z-10" />
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Доступ ограничен
        </h1>
        
        <p className="text-gray-700 mb-8 text-xl font-medium">
          Система недоступна с мобильных устройств
        </p>
        
        {/* Enhanced warning section */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-red-500 rounded-full p-2">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <p className="text-red-700 font-bold text-xl">
              CHRONOS заблокирован
            </p>
          </div>
          <p className="text-red-600 font-semibold text-lg">
            Система учета времени недоступна на мобильных устройствах и планшетах
          </p>
        </div>

        {/* Device information */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            Информация об устройстве
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">Устройство:</span>
              <span className="font-bold text-gray-800">{deviceInfo.deviceType}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">Браузер:</span>
              <span className="font-bold text-gray-800">{deviceInfo.browser}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="text-gray-600 font-medium">Разрешение:</span>
              <span className="font-bold text-gray-800">{deviceInfo.screenWidth} × {deviceInfo.screenHeight}</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced requirements section */}
        <div className="text-left space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-2">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-gray-800 text-xl">Системные требования</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
              <span className="font-semibold text-gray-700">Компьютер или ноутбук</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
              <span className="font-semibold text-gray-700">Минимальное разрешение: 1024×768</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"></div>
              <span className="font-semibold text-gray-700">Современный браузер (Chrome, Firefox, Safari, Edge)</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200">
              <Wifi className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-gray-700">Стабильное интернет-соединение</span>
            </div>
          </div>
        </div>

        {/* Enhanced footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <p className="text-purple-700 text-sm font-semibold">
            💼 CHRONOS - профессиональная система учета рабочего времени
          </p>
          <p className="text-purple-600 text-xs mt-1">
            Оптимизирована для работы на больших экранах и клавиатурного ввода
          </p>
        </div>
      </div>
    </div>
  );
};

// Add custom animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-float-delayed {
    animation: float-delayed 4s ease-in-out infinite;
    animation-delay: 1s;
  }
`;
document.head.appendChild(style);

export default MobileRestriction;