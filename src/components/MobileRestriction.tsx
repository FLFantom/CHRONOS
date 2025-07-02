import React, { useEffect, useState } from 'react';
import { Smartphone, Monitor, AlertTriangle, Shield, Lock, Eye } from 'lucide-react';

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
          className="fixed inset-0 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center overflow-hidden"
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
            padding: 0
          }}
        >
          {/* Дополнительный слой блокировки */}
          <div className="absolute inset-0 bg-black opacity-30 pointer-events-none"></div>
          
          {/* Основной контент блокировки - УПРОЩЕННЫЙ */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/30 relative z-10 mx-4">
            {/* Упрощенный заголовок */}
            <div className="bg-gradient-to-r from-red-500 to-purple-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent mb-4">
              🚫 ДОСТУП ЗАБЛОКИРОВАН
            </h1>
            
            <p className="text-gray-700 mb-6 text-base font-medium">
              Система недоступна с мобильных устройств
            </p>
            
            {/* Упрощенное предупреждение */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 font-bold">CHRONOS ЗАБЛОКИРОВАН</p>
              </div>
              <p className="text-red-600 text-sm">
                Система учета времени доступна только на компьютерах
              </p>
            </div>

            {/* Упрощенные требования */}
            <div className="text-left bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-5 h-5 text-blue-600" />
                <p className="font-bold text-gray-800">Требования</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">💻 Компьютер или ноутбук</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">📏 Минимум 1200×800</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700">🚫 НЕ мобильные устройства</span>
                </div>
              </div>
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
          
          /* Полная блокировка всех элементов кроме блокирующего экрана */
          body > div:not([style*="z-index: 2147483647"]) {
            display: none !important;
          }
        `}</style>
      </>
    );
  }

  return null;
};

export default MobileRestriction;