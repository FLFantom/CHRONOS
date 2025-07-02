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
      
      // КРИТИЧЕСКИ УСИЛЕННАЯ детекция мобильных устройств - ПОЛНАЯ БЛОКИРОВКА
      const mobileKeywords = [
        'Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 
        'Windows Phone', 'Opera Mini', 'IEMobile', 'Mobile Safari',
        'webOS', 'Kindle', 'Silk', 'Bada', 'Tizen', 'Nokia', 'Symbian',
        'Palm', 'PalmOS', 'Blazer', 'Avantgo', 'Danger', 'Hiptop',
        'Smartphone', 'Midp', 'Cldc', 'PdaNet', 'Pocket', 'PPC',
        'Windows CE', 'IEMobile', 'MSIEMobile', 'HTC', 'LG', 'MOT',
        'Samsung', 'SonyEricsson', 'MobileExplorer', 'PalmSource'
      ];
      
      const tabletKeywords = [
        'iPad', 'Android', 'Tablet', 'PlayBook', 'Kindle', 'Silk',
        'GT-P', 'SM-T', 'Nexus 7', 'Nexus 10', 'Xoom', 'SCH-I800'
      ];
      
      // Проверяем User Agent на мобильные ключевые слова
      const isMobileDevice = mobileKeywords.some(keyword => 
        userAgent.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Проверяем на планшеты
      const isTablet = tabletKeywords.some(keyword => 
        userAgent.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // КРИТИЧЕСКИ ВАЖНО: Блокируем все экраны меньше 1200px (увеличено с 1024px)
      const isSmallScreen = screenWidth < 1200;
      
      // Проверяем тач-устройства
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Проверяем ориентацию (мобильные часто меняют ориентацию)
      const hasOrientationAPI = 'orientation' in window;
      
      // Проверяем соотношение сторон (мобильные обычно вертикальные)
      const aspectRatio = screenWidth / screenHeight;
      const isMobileAspectRatio = aspectRatio < 1.2; // Вертикальная или почти квадратная ориентация
      
      // Проверяем плотность пикселей (мобильные обычно имеют высокую плотность)
      const pixelRatio = window.devicePixelRatio || 1;
      const isHighDensity = pixelRatio > 1.5;
      
      // Определение типа устройства
      let deviceType = 'Desktop';
      if (userAgent.includes('iPhone')) deviceType = 'iPhone';
      else if (userAgent.includes('iPad')) deviceType = 'iPad';
      else if (userAgent.includes('Android') && userAgent.includes('Mobile')) deviceType = 'Android Phone';
      else if (userAgent.includes('Android')) deviceType = 'Android Tablet';
      else if (isTablet) deviceType = 'Tablet';
      else if (isMobileDevice) deviceType = 'Mobile Device';
      else if (isSmallScreen) deviceType = 'Small Screen Device';
      
      // Определение браузера
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      else if (userAgent.includes('Opera')) browser = 'Opera';
      
      setDeviceInfo({
        userAgent,
        screenWidth,
        screenHeight,
        deviceType,
        browser
      });
      
      // КРИТИЧЕСКИ ВАЖНО: Блокируем ВСЕ подозрительные устройства
      const shouldBlock = 
        isMobileDevice ||           // Любое мобильное устройство
        isTablet ||                 // Любой планшет
        isSmallScreen ||            // Маленький экран (< 1200px)
        isTouchDevice ||            // Любое тач-устройство
        hasOrientationAPI ||        // Устройства с API ориентации
        (isMobileAspectRatio && isHighDensity) || // Мобильное соотношение + высокая плотность
        (screenWidth < 1200 || screenHeight < 800); // Минимальные требования к разрешению
      
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

  // КРИТИЧЕСКИ ВАЖНО: Блокируем прокрутку на мобильных устройствах
  useEffect(() => {
    if (isMobile) {
      // Полностью блокируем прокрутку
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';
      
      // Блокируем события прокрутки
      const preventScroll = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      // Блокируем все виды прокрутки
      document.addEventListener('scroll', preventScroll, { passive: false });
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('keydown', (e) => {
        // Блокируем клавиши прокрутки
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'].includes(e.code)) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
      
      return () => {
        // Восстанавливаем прокрутку при размонтировании
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.documentElement.style.overflow = '';
        document.removeEventListener('scroll', preventScroll);
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
      };
    }
  }, [isMobile]);

  // КРИТИЧЕСКИ ВАЖНО: Если обнаружено мобильное устройство - АБСОЛЮТНАЯ БЛОКИРОВКА
  if (isMobile) {
    return (
      <>
        {/* ПОЛНАЯ БЛОКИРОВКА: Перекрываем весь экран с максимальным приоритетом */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center p-4 overflow-hidden"
          style={{ 
            zIndex: 2147483647, // Максимально возможный z-index
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '1rem'
          }}
        >
          {/* Дополнительный слой блокировки */}
          <div className="absolute inset-0 bg-black opacity-30 pointer-events-none"></div>
          
          {/* Enhanced animated background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

          {/* Основной контент блокировки */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 max-w-lg w-full text-center shadow-2xl border border-white/30 relative z-10 max-h-[90vh] overflow-y-auto">
            {/* Enhanced header with gradient */}
            <div className="bg-gradient-to-r from-red-500 to-purple-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-50 animate-pulse"></div>
              <Smartphone className="w-10 h-10 text-white relative z-10" />
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent mb-4">
              🚫 ДОСТУП ЗАБЛОКИРОВАН
            </h1>
            
            <p className="text-gray-700 mb-6 text-lg font-medium">
              Система полностью недоступна с мобильных устройств
            </p>
            
            {/* Enhanced warning section */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="bg-red-500 rounded-full p-2">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-red-700 font-bold text-lg">
                  CHRONOS ЗАБЛОКИРОВАН
                </p>
              </div>
              <p className="text-red-600 font-semibold text-base mb-3">
                Система учета времени полностью недоступна на мобильных устройствах, планшетах и маленьких экранах
              </p>
              <div className="bg-red-100 rounded-xl p-3 border border-red-300">
                <p className="text-red-800 font-bold text-base">
                  ⚠️ КРИТИЧЕСКОЕ ОГРАНИЧЕНИЕ ⚠️
                </p>
                <p className="text-red-700 text-sm mt-1">
                  Доступ полностью запрещен для обеспечения безопасности и корректной работы системы
                </p>
              </div>
            </div>

            {/* Device information */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
              <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                Информация об устройстве
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600 font-medium">Устройство:</span>
                  <span className="font-bold text-red-600">{deviceInfo.deviceType}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600 font-medium">Браузер:</span>
                  <span className="font-bold text-gray-800">{deviceInfo.browser}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600 font-medium">Разрешение:</span>
                  <span className="font-bold text-red-600">{deviceInfo.screenWidth} × {deviceInfo.screenHeight}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-100 rounded-lg shadow-sm border border-red-200">
                  <span className="text-red-700 font-medium">Статус:</span>
                  <span className="font-bold text-red-800">🚫 ЗАБЛОКИРОВАНО</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced requirements section */}
            <div className="text-left space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-2">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-gray-800 text-base">Обязательные требования</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/80 rounded-xl shadow-sm border border-blue-100">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700 text-sm">💻 Только компьютер или ноутбук</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/80 rounded-xl shadow-sm border border-blue-100">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700 text-sm">📏 Минимальное разрешение: 1200×800</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/80 rounded-xl shadow-sm border border-blue-100">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700 text-sm">🌐 Современный браузер</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-100 rounded-xl shadow-sm border border-red-200">
                  <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full"></div>
                  <span className="font-semibold text-red-700 text-sm">🚫 НЕ мобильные устройства и планшеты</span>
                </div>
              </div>
            </div>

            {/* Enhanced footer */}
            <div className="mt-6 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <p className="text-purple-700 text-sm font-semibold">
                💼 CHRONOS - профессиональная система учета рабочего времени
              </p>
              <p className="text-purple-600 text-xs mt-1">
                Система оптимизирована исключительно для работы на больших экранах
              </p>
              <p className="text-red-600 text-xs mt-2 font-bold">
                ⚠️ Мобильные устройства строго запрещены для обеспечения безопасности
              </p>
            </div>
          </div>
        </div>
        
        {/* Дополнительная блокировка для предотвращения любого взаимодействия */}
        <style>{`
          body, html {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          * {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            -khtml-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          
          /* Блокируем все возможные способы прокрутки */
          body::-webkit-scrollbar {
            display: none !important;
          }
          
          /* Блокируем zoom на мобильных */
          meta[name=viewport] {
            content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" !important;
          }
        `}</style>
      </>
    );
  }

  return null;
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