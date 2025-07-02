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
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2147483647,
          margin: 0,
          padding: 0,
          background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 50%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Дополнительный слой блокировки */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        ></div>
        
        {/* Основной контент блокировки */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '320px',
            width: 'calc(100% - 32px)',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            position: 'relative',
            zIndex: 10,
            margin: '16px'
          }}
        >
          {/* Иконка */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%)',
              borderRadius: '16px',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)'
            }}
          >
            <Smartphone style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          
          {/* Заголовок */}
          <h1 
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              lineHeight: '1.2'
            }}
          >
            🚫 Доступ ограничен
          </h1>
          
          {/* Описание */}
          <p 
            style={{
              color: '#374151',
              marginBottom: '24px',
              fontSize: '16px',
              fontWeight: '500',
              lineHeight: '1.5'
            }}
          >
            Вход с мобильных устройств запрещен
          </p>
          
          {/* Предупреждение */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fdf2f8 100%)',
              border: '2px solid #fecaca',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '24px'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              <p 
                style={{
                  color: '#b91c1c',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  margin: 0
                }}
              >
                Система учета времени недоступна на мобильных устройствах
              </p>
            </div>
            <p 
              style={{
                color: '#dc2626',
                fontSize: '12px',
                margin: 0,
                lineHeight: '1.4'
              }}
            >
              Пожалуйста, используйте компьютер или ноутбук для входа в систему
            </p>
          </div>

          {/* Требования */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #bfdbfe',
              textAlign: 'left'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              <Monitor style={{ width: '20px', height: '20px', color: '#2563eb' }} />
              <p 
                style={{
                  fontWeight: 'bold',
                  color: '#1f2937',
                  fontSize: '14px',
                  margin: 0
                }}
              >
                Для работы с системой требуется:
              </p>
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}
              >
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    background: '#10b981',
                    borderRadius: '50%'
                  }}
                ></div>
                <span style={{ color: '#374151' }}>• Компьютер или ноутбук</span>
              </div>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}
              >
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    background: '#3b82f6',
                    borderRadius: '50%'
                  }}
                ></div>
                <span style={{ color: '#374151' }}>• Браузер Chrome, Firefox или Safari</span>
              </div>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    background: '#6366f1',
                    borderRadius: '50%'
                  }}
                ></div>
                <span style={{ color: '#374151' }}>• Стабильное интернет-соединение</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Стили для полной блокировки */}
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
      </div>
    );
  }

  return null;
};

export default MobileRestriction;