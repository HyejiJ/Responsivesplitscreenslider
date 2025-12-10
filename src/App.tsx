import { useState, useEffect, useCallback, useRef } from "react";
// [중요] 라이브러리 경로를 원래대로 돌려놓습니다 (호환성 문제 방지)
import { motion, PanInfo } from "motion/react"; 
import svgPathsPick from "./imports/svg-tfxb5qbd9u";
import svgPathsPeek from "./imports/svg-9ldm9562u5";

// [핵심 수정] 에러가 나던 일반 이미지 경로를 지우고, 
// 피그마에서 원래 잘 작동하던 'figma:asset' 경로를 사용합니다.
import imgCard4 from "figma:asset/7f12ea1300756f144a0fb5daaf68dbfc01103a46.png";

// ============================================================================
// 설정값
// ============================================================================
const DRAG_THRESHOLD = 50; 
const IDLE_TIMEOUT = 60000; 
const FLIP_DURATION = 0.6; 
const FLIP_DELAY = 0.1; 

// TV 최적화 곡선
const EASE_TV = [0.25, 0.1, 0.25, 1];

export default function App() {
  const [activeMode, setActiveMode] = useState<"peek" | "pick">("pick");
  const [peekSelectedCard, setPeekSelectedCard] = useState<number | null>(null);
  const [pickSelectedCard, setPickSelectedCard] = useState<number | null>(null);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setPeekSelectedCard(null);
      setPickSelectedCard(null);
    }, IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "touchstart", "click", "keydown"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const handleDragEnd = (event: any, info: PanInfo, panel: "peek" | "pick") => {
    if (Math.abs(info.offset.x) > DRAG_THRESHOLD) {
      if (panel === "pick" && activeMode === "peek") {
        setActiveMode("pick");
        setTimeout(() => setPeekSelectedCard(null), 400);
      } else if (panel === "peek" && activeMode === "pick") {
        setActiveMode("peek");
        setTimeout(() => setPickSelectedCard(null), 400);
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <div className="relative w-full aspect-video max-h-screen bg-white overflow-hidden">
        
        {/* ================= PEEK PANEL (LEFT) ================= */}
        <motion.div
          className="absolute top-0 h-full overflow-hidden"
          style={{ 
            width: '88.125%', 
            left: 0,
            // [수정] will-change 제거 (메모리 부족 방지)
          }}
          initial={false}
          animate={{
            x: activeMode === "peek" ? '0%' : '-86.525%',
          }}
          transition={{ duration: 0.8, ease: EASE_TV }}
        >
          <div className="relative w-full h-full">
            <PeekContent 
              isActive={activeMode === "peek"} 
              selectedCard={peekSelectedCard}
              setSelectedCard={setPeekSelectedCard}
            />

            {activeMode === "pick" && (
              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing z-50"
                drag="x"
                dragConstraints={{ left: 0, right: 100 }}
                dragElastic={0.1}
                onDragEnd={(e, info) => handleDragEnd(e, info, "peek")}
              />
            )}
          </div>
        </motion.div>

        {/* ================= PICK PANEL (RIGHT) ================= */}
        <motion.div
          className="absolute top-0 h-full overflow-hidden"
          style={{ 
            width: '88.125%', 
            right: 0, 
          }}
          initial={false}
          animate={{
            x: activeMode === "pick" ? '0%' : '86.525%',
          }}
          transition={{ duration: 0.8, ease: EASE_TV }}
        >
          <div className="relative w-full h-full">
            <PickContent 
              isActive={activeMode === "pick"} 
              selectedCard={pickSelectedCard}
              setSelectedCard={setPickSelectedCard}
            />

            {activeMode === "peek" && (
              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing z-50"
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(e, info) => handleDragEnd(e, info, "pick")}
              />
            )}
          </div>
        </motion.div>

        {/* ================= LOGOS ================= */}
        <motion.p 
          className="absolute leading-none not-italic text-[#1e1e1e] tracking-[-0.17vw] whitespace-nowrap origin-top-left z-40 pointer-events-none"
          style={{
            fontFamily: 'MungyeongGamhongApple, sans-serif',
            left: 'calc(49.73 / 1920 * 100%)',
            top: 'calc(71.64 / 1080 * 100%)',
          }}
          animate={{
            fontSize: activeMode === "peek" ? 'calc(96 / 1920 * 100vw)' : 'calc(43 / 1920 * 100vw)',
          }}
          transition={{ duration: 0.8, ease: EASE_TV }}
        >
          Peek
        </motion.p>

      </div>
    </div>
  );
}

// ============================================================================
// PEEK CONTENT
// ============================================================================
function PeekContent({ isActive, selectedCard, setSelectedCard }: any) {
  const cardPositions = [
    { left: 'calc(50% - 532.07 / 1692 * 100%)', time: '00:40 Left', width: 'calc(211.819 / 1692 * 100%)' },
    { left: 'calc(50% - 1.5 / 1692 * 100%)', time: '01:30 Left', width: 'calc(206.61 / 1692 * 100%)' },
    { left: 'calc(50% + 529.07 / 1692 * 100%)', time: '02:00 Left', width: 'calc(211.819 / 1692 * 100%)' }
  ];

  const handleCardClick = (index: number) => {
    if (selectedCard === index) setSelectedCard(null);
    else setSelectedCard(index);
  };

  return (
    <div className="absolute inset-0" style={{ backgroundImage: isActive ? undefined : "linear-gradient(270deg, rgb(106, 255, 129) 0%, rgba(255, 255, 255, 0) 15.222%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)", backgroundColor: 'white' }}>
      
      {isActive && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 30% 40%, rgba(106, 255, 129, 0.4) 0%, rgba(255, 255, 255, 0) 60%)",
          }}
        />
      )}

      {/* Intro Text */}
      <motion.div 
        className="absolute leading-[1.5] not-italic text-black text-nowrap tracking-[-0.018vw] whitespace-pre" 
        style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, left: 'calc(398 / 1692 * 100%)', top: 'calc(66.08 / 1080 * 100%)', fontSize: 'calc(32 / 1920 * 100vw)' }} 
        animate={{ opacity: isActive ? 1 : 0 }} 
        transition={{ duration: 0.5, delay: isActive ? 0.3 : 0 }}
      >
        <p className="mb-0">{`짧은 틈을 위한 PEEK의 맞춤형 콘텐츠 추천으로 `}</p><p>기다림을 내게 딱 맞는 스낵형 경험으로 채웁니다!</p>
      </motion.div>

      {/* Cards Container */}
      <motion.div animate={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }} transition={{ duration: 0.4 }}>
        <div style={{ position: 'absolute', height: '2px', backgroundColor: 'black', left: 'calc(64.06 / 1692 * 100%)', top: 'calc(970 / 1080 * 100%)', width: 'calc(1564.39 / 1692 * 100%)' }} />

        <div className="absolute bg-[#6aff81] content-stretch flex items-center justify-center px-[2.07%] py-0" style={{ left: 'calc(50% + 690.5 / 1692 * 100%)', top: 'calc(80 / 1080 * 100%)', transform: 'translateX(-50%)', borderRadius: 'calc(51 / 1920 * 100vw)' }}>
          <p className="leading-[2] not-italic relative shrink-0 text-black text-nowrap tracking-[-0.018vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(32 / 1920 * 100vw)' }}>30분 이하</p>
        </div>

        {/* Cards */}
        {cardPositions.map((position, index) => {
          const isSelected = selectedCard === index;
          return (
            <motion.div 
              key={`card-${index}`} 
              className="absolute cursor-pointer" 
              style={{ 
                height: 'calc(554.663 / 1080 * 100%)', 
                left: position.left, 
                top: 'calc(309.99 / 1080 * 100%)', 
                width: 'calc(454.115 / 1692 * 100%)', 
                borderRadius: 'calc(16.483 / 1920 * 100vw)', 
                zIndex: isSelected ? 30 : 10, 
                perspective: '1000px', 
              }} 
              animate={{ scale: isSelected ? 1.14 : 1, x: '-50%' }} 
              transition={{ duration: FLIP_DURATION, ease: EASE_TV, delay: isSelected ? FLIP_DELAY : 0 }} 
              onClick={() => handleCardClick(index)}
            >
              <motion.div 
                className="absolute inset-0" 
                style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', transformStyle: 'preserve-3d' }} 
                animate={{ rotateY: isSelected ? 180 : 0 }} 
                transition={{ duration: FLIP_DURATION, ease: EASE_TV, delay: isSelected ? FLIP_DELAY : 0 }}
              >
                {/* [원상복구] 안전한 이미지 경로(imgCard4) 사용 */}
                <img alt="front" className="absolute inset-0 max-w-none object-50%-50% object-cover size-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} src={imgCard4} />
                
                {/* Back (같은 이미지) */}
                <img alt="back" className="absolute inset-0 max-w-none object-50%-50% object-cover size-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} src={imgCard4} />
              </motion.div>
            </motion.div>
          );
        })}

        {/* Time Labels */}
        {cardPositions.map((position, index) => (
          <motion.div key={`time-${index}`} className="absolute content-stretch flex items-center justify-center px-[2.05%] py-0" style={{ height: 'calc(57 / 1080 * 100%)', left: position.left, top: 'calc(941.5 / 1080 * 100%)', transform: 'translateX(-50%)', width: position.width, borderRadius: 'calc(41.584 / 1920 * 100vw)' }} animate={{ backgroundColor: selectedCard === index ? '#000000' : '#ffffff' }} transition={{ duration: 0.3, delay: selectedCard === index ? FLIP_DELAY : 0 }}>
            <div aria-hidden="true" className="absolute border-[1.75px] border-black border-solid inset-0 pointer-events-none" style={{ borderRadius: 'calc(41.584 / 1920 * 100vw)' }} /><p className="leading-[2] not-italic relative shrink-0 text-nowrap tracking-[-0.016vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(28.538 / 1920 * 100vw)' }} animate={{ color: selectedCard === index ? '#6aff81' : '#000000' }} transition={{ duration: 0.3, delay: selectedCard === index ? FLIP_DELAY : 0 }}>{position.time}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================================================
// PICK CONTENT
// ============================================================================
function PickContent({ isActive, selectedCard, setSelectedCard }: any) {
  const cardPositions = [
    { left: 'calc(50% - 532.07 / 1692 * 100%)', time: '00:40 Left', width: 'calc(211.819 / 1692 * 100%)', top: 'calc(309.99 / 1080 * 100%)' },
    { left: 'calc(50% - 1.5 / 1692 * 100%)', time: '01:30 Left', width: 'calc(206.61 / 1692 * 100%)', top: 'calc(309.96 / 1080 * 100%)' },
    { left: 'calc(50% + 529.07 / 1692 * 100%)', time: '02:00 Left', width: 'calc(211.819 / 1692 * 100%)', top: 'calc(309.96 / 1080 * 100%)' }
  ];
  const handleCardClick = (index: number) => {
    if (selectedCard === index) setSelectedCard(null);
    else setSelectedCard(index);
  };
  return (
    <div className="absolute inset-0" style={{ backgroundImage: isActive ? undefined : "linear-gradient(270deg, rgba(255, 255, 255, 0) 81.811%, rgb(82, 255, 254) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)", backgroundColor: 'white' }}>
      
      {isActive && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 70% 40%, rgba(79, 255, 254, 0.4) 0%, rgba(255, 255, 255, 0) 60%)",
          }}
        />
      )}

      {/* Logo */}
      <motion.div className="absolute flex flex-col justify-center leading-[0] not-italic text-[#1e1e1e] text-nowrap tracking-[-0.15vw] origin-left" style={{ fontFamily: 'MungyeongGamhongApple, sans-serif', left: 'calc(50% - 794.8 / 1692 * 100%)', top: 'calc(71.64 / 1080 * 100%)' }} animate={{ fontSize: isActive ? 'calc(96 / 1920 * 100vw)' : 'calc(43 / 1920 * 100vw)' }} transition={{ duration: 0.8, ease: EASE_TV }}>
        <p className="leading-none whitespace-pre">Pick</p>
      </motion.div>

      <motion.div animate={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }} transition={{ duration: 0.4 }}>
        <div className="absolute leading-[1.5] not-italic text-black text-nowrap tracking-[-0.018vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, left: 'calc(398 / 1692 * 100%)', top: 'calc(66.08 / 1080 * 100%)', fontSize: 'calc(32 / 1920 * 100vw)' }}>
          <p className="mb-0">주변을 탐험할 수 있는 루트 기반의 '픽' 큐레이션이</p><p>유저의 남은 여정을 풍부하게 확장합니다!</p>
        </div>
        <div style={{ position: 'absolute', height: '2px', backgroundColor: 'black', left: 'calc(64.06 / 1692 * 100%)', top: 'calc(970 / 1080 * 100%)', width: 'calc(1564.39 / 1692 * 100%)' }} />
        <div className="absolute bg-[#52fffe] content-stretch flex items-center justify-center px-[2.07%] py-0" style={{ left: 'calc(50% + 690.5 / 1692 * 100%)', top: 'calc(80 / 1080 * 100%)', transform: 'translateX(-50%)', borderRadius: 'calc(51 / 1920 * 100vw)' }}><p className="leading-[2] not-italic relative shrink-0 text-black text-nowrap tracking-[-0.018vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(32 / 1920 * 100vw)' }}>30분 이상</p></div>
        
        {/* Cards */}
        {cardPositions.map((position, index) => {
          const isSelected = selectedCard === index;
          return (
            <motion.div key={`card-${index}`} className="absolute cursor-pointer" style={{ height: 'calc(554.663 / 1080 * 100%)', left: position.left, top: position.top, width: 'calc(454.115 / 1692 * 100%)', borderRadius: 'calc(16.483 / 1920 * 100vw)', zIndex: isSelected ? 30 : 10, perspective: '1000px' }} animate={{ scale: isSelected ? 1.14 : 1, x: '-50%' }} transition={{ duration: FLIP_DURATION, ease: EASE_TV, delay: isSelected ? FLIP_DELAY : 0 }} onClick={() => handleCardClick(index)}>
              <motion.div className="absolute inset-0" style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', transformStyle: 'preserve-3d' }} animate={{ rotateY: isSelected ? 180 : 0 }} transition={{ duration: FLIP_DURATION, ease: EASE_TV, delay: isSelected ? FLIP_DELAY : 0 }}>
                {/* [원상복구] imgCard4 사용 */}
                <img alt="front" className="absolute inset-0 max-w-none object-50%-50% object-cover size-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} src={imgCard4} />
                <img alt="back" className="absolute inset-0 max-w-none object-50%-50% object-cover size-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} src={imgCard4} />
              </motion.div>
            </motion.div>
          );
        })}
        
        {/* Time Labels */}
        {cardPositions.map((position, index) => (
          <motion.div key={`time-${index}`} className="absolute content-stretch flex items-center justify-center px-[2.05%] py-0" style={{ height: 'calc(57 / 1080 * 100%)', left: position.left, top: 'calc(941.5 / 1080 * 100%)', transform: 'translateX(-50%)', width: position.width, borderRadius: 'calc(41.584 / 1920 * 100vw)' }} animate={{ backgroundColor: selectedCard === index ? '#000000' : '#ffffff' }} transition={{ duration: 0.3, delay: selectedCard === index ? FLIP_DELAY : 0 }}>
            <div aria-hidden="true" className="absolute border-[1.75px] border-black border-solid inset-0 pointer-events-none" style={{ borderRadius: 'calc(41.584 / 1920 * 100vw)' }} /><p className="leading-[2] not-italic relative shrink-0 text-nowrap tracking-[-0.016vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(28.538 / 1920 * 100vw)' }} animate={{ color: selectedCard === index ? '#52fffe' : '#000000' }} transition={{ duration: 0.3, delay: selectedCard === index ? FLIP_DELAY : 0 }}>{position.time}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}