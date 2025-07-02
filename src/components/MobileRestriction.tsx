import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

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
    <div className="fixed inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-red-600 flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Доступ ограничен
        </h1>
        
        <p className="text-gray-600 mb-6">
          Вход с мобильных устройств запрещен
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium mb-2">
            Система учета времени недоступна на мобильных устройствах
          </p>
          <p className="text-red-600 text-sm">
            Пожалуйста, используйте компьютер или ноутбук для входа в систему
          </p>
        </div>
        
        <div className="text-left space-y-2 text-sm text-gray-600">
          <p className="font-medium">Для работы с системой требуется:</p>
          <ul className="space-y-1 pl-4">
            <li>• Компьютер или ноутбук</li>
            <li>• Браузер Chrome, Firefox или Safari</li>
            <li>• Стабильное интернет-соединение</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileRestriction;