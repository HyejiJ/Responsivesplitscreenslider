import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { CSSProperties } from "react";
// [중요] 라이브러리 경로를 원래대로 돌려놓습니다 (호환성 문제 방지)
import { motion, PanInfo } from "motion/react"; 
import svgPathsPick from "./imports/svg-tfxb5qbd9u";
import svgPathsPeek from "./imports/svg-9ldm9562u5";

// [핵심 수정] 에러가 나던 일반 이미지 경로를 지우고, 
// 피그마에서 원래 잘 작동하던 'figma:asset' 경로를 사용합니다.
import imgCard4 from "figma:asset/7f12ea1300756f144a0fb5daaf68dbfc01103a46.png";

// Pick 페이지 카드 이미지 import
import pickFront1 from "figma:asset/pick_front_1.png";
import pickBack1 from "figma:asset/pick_back_1.svg";
import pickFront2 from "figma:asset/pick_front_2.png";
import pickBack2 from "figma:asset/pick_back_2.png";
import pickFront3 from "figma:asset/pick_front_3.png";
import pickBack3 from "figma:asset/pick_back_3.png";

// Peek 페이지 카드 이미지 import
import peekFront1 from "figma:asset/peek_front_1.png";
import peekBack1 from "figma:asset/peek_back_1.png";
import peekFront2 from "figma:asset/peek_front_2.png";
import peekBack2 from "figma:asset/peek_back_2.png";
import peekFront3 from "figma:asset/peek_front_3.png";
import peekBack3 from "figma:asset/peek_back_3.png";

// Pick 페이지 카드 이미지 설정 (각 카드별 앞면/뒷면 이미지)
// 숫자 1 = 가장 왼쪽 (index 0), 2 = 가운데 (index 1), 3 = 가장 오른쪽 (index 2)
const pickCardImages: CardImage[] = [
  {
    front: pickFront1, // 카드 1 (가장 왼쪽) 앞면 이미지
    back: pickBack1,   // 카드 1 (가장 왼쪽) 뒷면 이미지
  },
  {
    front: pickFront2, // 카드 2 (가운데) 앞면 이미지
    back: pickBack2,   // 카드 2 (가운데) 뒷면 이미지
  },
  {
    front: pickFront3, // 카드 3 (가장 오른쪽) 앞면 이미지
    back: pickBack3,   // 카드 3 (가장 오른쪽) 뒷면 이미지
  },
];

// Peek 페이지 카드 이미지 설정 (각 카드별 앞면/뒷면 이미지)
// 숫자 1 = 가장 왼쪽 (index 0), 2 = 가운데 (index 1), 3 = 가장 오른쪽 (index 2)
const peekCardImages: CardImage[] = [
  {
    front: peekFront1, // 카드 1 (가장 왼쪽) 앞면 이미지
    back: peekBack1,   // 카드 1 (가장 왼쪽) 뒷면 이미지
  },
  {
    front: peekFront2, // 카드 2 (가운데) 앞면 이미지
    back: peekBack2,   // 카드 2 (가운데) 뒷면 이미지
  },
  {
    front: peekFront3, // 카드 3 (가장 오른쪽) 앞면 이미지
    back: peekBack3,   // 카드 3 (가장 오른쪽) 뒷면 이미지
  },
];

// ============================================================================
// 설정값
// ============================================================================
const DRAG_THRESHOLD = 50; 
const IDLE_TIMEOUT = 60000; // 60초
// 카드 플립 애니메이션 설정 (0.8초로 통일)
const FLIP_DURATION = 0.8; // 카드 플립 애니메이션 지속 시간 (모든 카드 동일, 딜레이 없음)
const FLIP_RESET_DURATION = 0.8; // 카드 리셋 애니메이션 지속 시간 (모든 카드 동일, 딜레이 없음)
const FLIP_DELAY = 0; // 카드 플립 시작 지연 시간 (딜레이 없음)
const FLIP_OLD_CARD_RESET_DELAY = 0; // 새 카드 선택 후 기존 카드 리셋 딜레이 (딜레이 없음, 동시 실행)
const DRAG_TRANSITION_DELAY = 400; // 드래그 전환 후 카드 리셋 지연 시간 (ms)

// 부드러운 애니메이션 곡선 (ease-in-out-cubic: 더 부드럽고 자연스러운 전환)
const EASE_SMOOTH = [0.4, 0.0, 0.6, 1] as const; // ease-in-out-cubic (시작과 끝이 모두 부드러움)
// TV 최적화 곡선 (기존)
const EASE_TV = [0.25, 0.1, 0.25, 1] as const;

// 타입 정의
interface CardPosition {
  left: string;
  time: string;
  width: string;
  top?: string;
}

interface CardImage {
  front: string;
  back: string;
}

interface ContentProps {
  isActive: boolean;
  selectedCard: number | null;
  setSelectedCard: (card: number | null) => void;
}

export default function App() {
  const [activeMode, setActiveMode] = useState<"peek" | "pick">("pick");
  const [peekSelectedCard, setPeekSelectedCard] = useState<number | null>(null);
  const [pickSelectedCard, setPickSelectedCard] = useState<number | null>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    idleTimerRef.current = setTimeout(() => {
      setPeekSelectedCard(null);
      setPickSelectedCard(null);
      idleTimerRef.current = null;
    }, IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "touchstart", "click", "keydown"];
    const handleEvent = () => resetIdleTimer();
    
    events.forEach((event) => {
      window.addEventListener(event, handleEvent);
    });
    resetIdleTimer();
    
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (dragTransitionTimerRef.current) {
        clearTimeout(dragTransitionTimerRef.current);
        dragTransitionTimerRef.current = null;
      }
    };
  }, [resetIdleTimer]);

  const handleDragEnd = useCallback((_event: unknown, info: PanInfo, panel: "peek" | "pick") => {
    if (Math.abs(info.offset.x) > DRAG_THRESHOLD) {
      // 이전 타이머 정리
      if (dragTransitionTimerRef.current) {
        clearTimeout(dragTransitionTimerRef.current);
      }
      
      if (panel === "pick" && activeMode === "peek") {
        setActiveMode("pick");
        dragTransitionTimerRef.current = setTimeout(() => {
          setPeekSelectedCard(null);
          dragTransitionTimerRef.current = null;
        }, DRAG_TRANSITION_DELAY);
      } else if (panel === "peek" && activeMode === "pick") {
        setActiveMode("peek");
        dragTransitionTimerRef.current = setTimeout(() => {
          setPickSelectedCard(null);
          dragTransitionTimerRef.current = null;
        }, DRAG_TRANSITION_DELAY);
      }
    }
  }, [activeMode]);

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
// 이미지 에러 처리 컴포넌트
// ============================================================================
interface ImageWithErrorHandlerProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallbackSrc?: string;
}

function ImageWithErrorHandler({ 
  src, 
  alt, 
  className = "", 
  style, 
  fallbackSrc 
}: ImageWithErrorHandlerProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    } else if (!hasError) {
      // 최종 fallback: 투명한 1x1 픽셀
      setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+');
      setHasError(true);
    }
  }, [hasError, imgSrc, fallbackSrc]);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img 
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="eager"
      decoding="async"
    />
  );
}

// ============================================================================
// PEEK CONTENT
// ============================================================================
function PeekContent({ isActive, selectedCard, setSelectedCard }: ContentProps) {
  const cardPositions: CardPosition[] = useMemo(() => [
    { left: 'calc(50% - 532.07 / 1692 * 100%)', time: '00:40 Left', width: 'calc(211.819 / 1692 * 100%)' },
    { left: 'calc(50% - 1.5 / 1692 * 100%)', time: '01:30 Left', width: 'calc(206.61 / 1692 * 100%)' },
    { left: 'calc(50% + 529.07 / 1692 * 100%)', time: '02:00 Left', width: 'calc(211.819 / 1692 * 100%)' }
  ], []);

  const prevSelectedCardRef = useRef<number | null>(null);
  
  // selectedCard 변경 추적
  useEffect(() => {
    prevSelectedCardRef.current = selectedCard;
  }, [selectedCard]);

  const handleCardClick = useCallback((index: number) => {
    if (selectedCard === index) {
      // 같은 카드를 다시 클릭하면 바로 닫기
      setSelectedCard(null);
    } else {
      // 새 카드를 먼저 선택 (즉시 플립 시작)
      setSelectedCard(index);
      // 기존 카드는 transition의 delay로 자연스럽게 늦게 리셋됨
    }
  }, [selectedCard, setSelectedCard]);

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
        <div style={{ position: 'absolute', height: 'calc(3 / 1080 * 100%)', backgroundColor: 'black', left: 'calc(64.06 / 1692 * 100%)', top: 'calc(970 / 1080 * 100%)', width: 'calc(1564.39 / 1692 * 100%)' }} />
        {/* 라인 시작점 원형 점 */}
        <div style={{ position: 'absolute', left: 'calc(64.06 / 1692 * 100%)', top: 'calc((970 + 1.5) / 1080 * 100%)', transform: 'translate(-50%, -50%)', width: 'calc(16 / 1920 * 100vw)', height: 'calc(16 / 1920 * 100vw)', aspectRatio: '1', borderRadius: '50%', backgroundColor: 'black', pointerEvents: 'none' }} />
        {/* 라인 끝점 원형 점 */}
        <div style={{ position: 'absolute', left: 'calc((64.06 + 1564.39) / 1692 * 100%)', top: 'calc((970 + 1.5) / 1080 * 100%)', transform: 'translate(-50%, -50%)', width: 'calc(16 / 1920 * 100vw)', height: 'calc(16 / 1920 * 100vw)', aspectRatio: '1', borderRadius: '50%', backgroundColor: 'black', pointerEvents: 'none' }} />

        <div className="absolute bg-[#6aff81] content-stretch flex items-center justify-center px-[2.07%] py-0" style={{ left: 'calc(50% + 690.5 / 1692 * 100%)', top: 'calc(80 / 1080 * 100%)', transform: 'translateX(-50%)', borderRadius: 'calc(51 / 1920 * 100vw)' }}>
          <p className="leading-[2] not-italic relative shrink-0 text-black text-nowrap tracking-[-0.018vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(32 / 1920 * 100vw)' }}>30분 이하</p>
        </div>

        {/* Cards */}
        {cardPositions.map((position, index) => {
          const isSelected = selectedCard === index;
          const wasPreviouslySelected = prevSelectedCardRef.current === index;
          const isResetting = !isSelected && wasPreviouslySelected;
          const cardImages = peekCardImages[index] || { front: imgCard4, back: imgCard4 };
          return (
            <motion.div 
              key={`card-${index}`} 
              className="absolute cursor-pointer" 
              style={{ 
                aspectRatio: '454.115 / 554.663',
                height: 'calc(554.663 / 1080 * 100%)', 
                left: position.left, 
                top: 'calc(309.99 / 1080 * 100%)', 
                width: 'calc(454.115 / 1692 * 100%)', 
                borderRadius: 'calc(16.483 / 1920 * 100vw)', 
                zIndex: isSelected ? 30 : 10, 
                perspective: '1000px', 
              }} 
              animate={{ scale: isSelected ? 1.14 : 1, x: '-50%' }} 
              transition={{ 
                duration: isSelected ? FLIP_DURATION : FLIP_RESET_DURATION, 
                ease: EASE_SMOOTH, 
                delay: isSelected ? FLIP_DELAY : (isResetting ? FLIP_OLD_CARD_RESET_DELAY : 0)
              }} 
              onClick={() => handleCardClick(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(index);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${position.time} 카드 선택`}
              aria-pressed={isSelected}
            >
              <motion.div 
                className="absolute inset-0" 
                style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', transformStyle: 'preserve-3d' }} 
                animate={{ rotateY: isSelected ? 180 : 0 }} 
                transition={{ 
                  duration: isSelected ? FLIP_DURATION : FLIP_RESET_DURATION, 
                  ease: EASE_SMOOTH, 
                  delay: isSelected ? FLIP_DELAY : (isResetting ? FLIP_OLD_CARD_RESET_DELAY : 0)
                }}
              >
                {/* 카드 앞면 이미지 */}
                <ImageWithErrorHandler 
                  alt={`peek-card-${index}-front`}
                  src={cardImages.front}
                  fallbackSrc={imgCard4}
                  className="absolute max-w-none object-cover shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" 
                  style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                />
                
                {/* 카드 뒷면 이미지 */}
                <ImageWithErrorHandler 
                  alt={`peek-card-${index}-back`}
                  src={cardImages.back}
                  fallbackSrc={imgCard4}
                  className="absolute max-w-none object-cover shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" 
                  style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                />
              </motion.div>
            </motion.div>
          );
        })}

        {/* Time Labels */}
        {cardPositions.map((position, index) => (
          <motion.div key={`time-${index}`} className="absolute content-stretch flex items-center justify-center px-[2.05%] py-0" style={{ height: 'calc(57 / 1080 * 100%)', left: position.left, top: 'calc(941.5 / 1080 * 100%)', transform: 'translateX(-50%)', width: position.width, borderRadius: 'calc(41.584 / 1920 * 100vw)' }} animate={{ backgroundColor: selectedCard === index ? '#000000' : '#ffffff' }} transition={{ duration: 0.3, delay: selectedCard === index ? FLIP_DELAY : 0 }}>
            <div aria-hidden="true" className="absolute border-black border-solid inset-0 pointer-events-none" style={{ borderWidth: 'calc(1.75 / 1920 * 100vw)', borderRadius: 'calc(41.584 / 1920 * 100vw)' }} /><motion.p className="leading-[2] not-italic relative shrink-0 text-nowrap tracking-[-0.016vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(28.538 / 1920 * 100vw)' }} animate={{ color: selectedCard === index ? '#80FF72' : '#000000' }} transition={{ duration: 0.4, ease: EASE_SMOOTH, delay: selectedCard === index ? FLIP_DELAY : 0 }}>{position.time}</motion.p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================================================
// PICK CONTENT
// ============================================================================
function PickContent({ isActive, selectedCard, setSelectedCard }: ContentProps) {
  const cardPositions: CardPosition[] = useMemo(() => [
    { left: 'calc(50% - 532.07 / 1692 * 100%)', time: '00:40 Left', width: 'calc(211.819 / 1692 * 100%)', top: 'calc(309.99 / 1080 * 100%)' },
    { left: 'calc(50% - 1.5 / 1692 * 100%)', time: '01:30 Left', width: 'calc(206.61 / 1692 * 100%)', top: 'calc(309.96 / 1080 * 100%)' },
    { left: 'calc(50% + 529.07 / 1692 * 100%)', time: '02:00 Left', width: 'calc(211.819 / 1692 * 100%)', top: 'calc(309.96 / 1080 * 100%)' }
  ], []);
  
  const prevSelectedCardRef = useRef<number | null>(null);
  
  // selectedCard 변경 추적
  useEffect(() => {
    prevSelectedCardRef.current = selectedCard;
  }, [selectedCard]);

  const handleCardClick = useCallback((index: number) => {
    if (selectedCard === index) {
      // 같은 카드를 다시 클릭하면 바로 닫기
      setSelectedCard(null);
    } else {
      // 새 카드를 먼저 선택 (즉시 플립 시작)
      setSelectedCard(index);
      // 기존 카드는 transition의 delay로 자연스럽게 늦게 리셋됨
    }
  }, [selectedCard, setSelectedCard]);
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
        <div style={{ position: 'absolute', height: 'calc(3 / 1080 * 100%)', backgroundColor: 'black', left: 'calc(64.06 / 1692 * 100%)', top: 'calc(970 / 1080 * 100%)', width: 'calc(1564.39 / 1692 * 100%)' }} />
        {/* 라인 시작점 원형 점 */}
        <div style={{ position: 'absolute', left: 'calc(64.06 / 1692 * 100%)', top: 'calc((970 + 1.5) / 1080 * 100%)', transform: 'translate(-50%, -50%)', width: 'calc(16 / 1920 * 100vw)', height: 'calc(16 / 1920 * 100vw)', aspectRatio: '1', borderRadius: '50%', backgroundColor: 'black', pointerEvents: 'none' }} />
        {/* 라인 끝점 원형 점 */}
        <div style={{ position: 'absolute', left: 'calc((64.06 + 1564.39) / 1692 * 100%)', top: 'calc((970 + 1.5) / 1080 * 100%)', transform: 'translate(-50%, -50%)', width: 'calc(16 / 1920 * 100vw)', height: 'calc(16 / 1920 * 100vw)', aspectRatio: '1', borderRadius: '50%', backgroundColor: 'black', pointerEvents: 'none' }} />
        <div className="absolute bg-[#52fffe] content-stretch flex items-center justify-center px-[2.07%] py-0" style={{ left: 'calc(50% + 690.5 / 1692 * 100%)', top: 'calc(80 / 1080 * 100%)', transform: 'translateX(-50%)', borderRadius: 'calc(51 / 1920 * 100vw)' }}><p className="leading-[2] not-italic relative shrink-0 text-black text-nowrap tracking-[-0.018vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(32 / 1920 * 100vw)' }}>30분 이상</p></div>
        
        {/* Cards */}
        {cardPositions.map((position, index) => {
          const isSelected = selectedCard === index;
          const wasPreviouslySelected = prevSelectedCardRef.current === index;
          const isResetting = !isSelected && wasPreviouslySelected;
          const cardImages = pickCardImages[index] || { front: imgCard4, back: imgCard4 };
          return (
            <motion.div key={`card-${index}`} className="absolute cursor-pointer" style={{ aspectRatio: '454.115 / 554.663', height: 'calc(554.663 / 1080 * 100%)', left: position.left, top: position.top, width: 'calc(454.115 / 1692 * 100%)', borderRadius: 'calc(16.483 / 1920 * 100vw)', zIndex: isSelected ? 30 : 10, perspective: '1000px' }} animate={{ scale: isSelected ? 1.14 : 1, x: '-50%' }} transition={{ duration: isSelected ? FLIP_DURATION : FLIP_RESET_DURATION, ease: EASE_SMOOTH, delay: isSelected ? FLIP_DELAY : (isResetting ? FLIP_OLD_CARD_RESET_DELAY : 0) }} onClick={() => handleCardClick(index)}>
              <motion.div className="absolute inset-0" style={{ borderRadius: 'calc(16.483 / 1920 * 100vw)', transformStyle: 'preserve-3d' }} animate={{ rotateY: isSelected ? 180 : 0 }} transition={{ duration: isSelected ? FLIP_DURATION : FLIP_RESET_DURATION, ease: EASE_SMOOTH, delay: isSelected ? FLIP_DELAY : (isResetting ? FLIP_OLD_CARD_RESET_DELAY : 0) }}>
                {/* 카드 앞면 이미지 */}
                <ImageWithErrorHandler 
                  alt={`card-${index}-front`}
                  src={cardImages.front}
                  fallbackSrc={imgCard4}
                  className="absolute max-w-none object-cover shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" 
                  style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                />
                {/* 카드 뒷면 이미지 */}
                <ImageWithErrorHandler 
                  alt={`card-${index}-back`}
                  src={cardImages.back}
                  fallbackSrc={imgCard4}
                  className="absolute max-w-none object-cover shadow-[0px_4px_12px_rgba(0,0,0,0.15)]" 
                  style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', borderRadius: 'calc(16.483 / 1920 * 100vw)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                />
              </motion.div>
            </motion.div>
          );
        })}
        
        {/* Time Labels */}
        {cardPositions.map((position, index) => (
          <motion.div key={`time-${index}`} className="absolute content-stretch flex items-center justify-center px-[2.05%] py-0" style={{ height: 'calc(57 / 1080 * 100%)', left: position.left, top: 'calc(941.5 / 1080 * 100%)', transform: 'translateX(-50%)', width: position.width, borderRadius: 'calc(41.584 / 1920 * 100vw)' }} animate={{ backgroundColor: selectedCard === index ? '#000000' : '#ffffff' }} transition={{ duration: 0.4, ease: EASE_SMOOTH, delay: selectedCard === index ? FLIP_DELAY : 0 }}>
            <div aria-hidden="true" className="absolute border-black border-solid inset-0 pointer-events-none" style={{ borderWidth: 'calc(1.75 / 1920 * 100vw)', borderRadius: 'calc(41.584 / 1920 * 100vw)' }} /><motion.p className="leading-[2] not-italic relative shrink-0 text-nowrap tracking-[-0.016vw] whitespace-pre" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 500, fontSize: 'calc(28.538 / 1920 * 100vw)' }} animate={{ color: selectedCard === index ? '#4FFFFE' : '#000000' }} transition={{ duration: 0.4, ease: EASE_SMOOTH, delay: selectedCard === index ? FLIP_DELAY : 0 }}>{position.time}</motion.p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}