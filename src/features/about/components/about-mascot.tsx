"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type PupilOffset = {
  x: number;
  y: number;
};

const SECTION_MESSAGES = [
  {
    id: "hero",
    message: "Hi, I'm Node! Scroll down — I'll point the way.",
  },
  {
    id: "why",
    message: "This part explains why I exist. Spoiler: broken workflows.",
  },
  {
    id: "how",
    message:
      "Try the switcher up there — Mermaid stays local, PlantUML takes a trip.",
  },
  {
    id: "roadmap",
    message: "Every good flowchart knows where it goes next.",
  },
  {
    id: "faq",
    message: "Curious? Poke a question open.",
  },
  {
    id: "cta",
    message: "Go on — paste that diagram code!",
  },
];

const CLICK_FACTS = [
  "Fun fact: I only connect to well-formed syntax.",
  "I have three ports and zero commitment issues.",
  "Every SVG that passes through iGram gets sanitized.",
  "I'm the node in the logo. Yes, I'm kind of a big deal.",
  "Keep clicking and I might become a decision diamond…",
  "Okay okay — back to work. Try the workspace!",
];

const BUBBLE_HIDE_DELAY = 3800;
const JUMP_DURATION = 680;
const CRAWL_SETTLE_DELAY = 380;

function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AboutMascot() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<number | null>(null);
  const jumpTimerRef = useRef<number | null>(null);
  const bubbleTimerRef = useRef<number | null>(null);
  const crawlTimerRef = useRef<number | null>(null);
  const [message, setMessage] = useState(SECTION_MESSAGES[0].message);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [pupilOffset, setPupilOffset] = useState<PupilOffset>({ x: 0, y: 1 });
  const [isJumping, setIsJumping] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const motionEnabled = useSyncExternalStore(
    subscribeToMotionPreference,
    () => !prefersReducedMotion(),
    () => true,
  );

  const say = useCallback((text: string) => {
    setMessage(text);
    setIsBubbleVisible(true);
    if (bubbleTimerRef.current !== null) {
      window.clearTimeout(bubbleTimerRef.current);
    }
    bubbleTimerRef.current = window.setTimeout(
      () => setIsBubbleVisible(false),
      BUBBLE_HIDE_DELAY,
    );
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const sections = SECTION_MESSAGES.map((item) => ({
      ...item,
      element: document.getElementById(item.id),
    })).filter(
      (
        item,
      ): item is (typeof SECTION_MESSAGES)[number] & { element: HTMLElement } =>
        item.element instanceof HTMLElement,
    );

    let lastSectionId = "";
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const current = sections.find(
          (item) => item.element === visibleEntry.target,
        );
        if (current && current.id !== lastSectionId) {
          lastSectionId = current.id;
          say(current.message);
        }
      },
      { rootMargin: "-24% 0px -50%", threshold: [0.2, 0.45, 0.7] },
    );

    sections.forEach((item) => observer.observe(item.element));

    return () => observer.disconnect();
  }, [say]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const handleScroll = () => {
      setIsCrawling(true);
      if (crawlTimerRef.current !== null) {
        window.clearTimeout(crawlTimerRef.current);
      }
      crawlTimerRef.current = window.setTimeout(
        () => setIsCrawling(false),
        CRAWL_SETTLE_DELAY,
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (crawlTimerRef.current !== null) {
        window.clearTimeout(crawlTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        const mascot = buttonRef.current;
        if (!mascot) {
          return;
        }

        const rect = mascot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = event.clientX - centerX;
        const deltaY = event.clientY - centerY;
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const x = clamp((deltaX / distance) * 2.4, -2.4, 2.4);
        const y = clamp((deltaY / distance) * 1.8, -1.8, 1.8);

        setPupilOffset({ x, y });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    say(CLICK_FACTS[factIndex]);
    setFactIndex((current) => (current + 1) % CLICK_FACTS.length);

    if (prefersReducedMotion()) {
      return;
    }

    setIsJumping(true);
    if (jumpTimerRef.current !== null) {
      window.clearTimeout(jumpTimerRef.current);
    }
    jumpTimerRef.current = window.setTimeout(
      () => setIsJumping(false),
      JUMP_DURATION,
    );
  };

  useEffect(() => {
    return () => {
      if (jumpTimerRef.current !== null) {
        window.clearTimeout(jumpTimerRef.current);
      }
      if (bubbleTimerRef.current !== null) {
        window.clearTimeout(bubbleTimerRef.current);
      }
    };
  }, []);

  const crawlDuration = isCrawling ? "0.4s" : "2.2s";
  const bobAnimation = (delay: string) =>
    motionEnabled
      ? `about-bob ${crawlDuration} ease-in-out ${delay} infinite`
      : undefined;
  const tailLift = isCrawling ? 62 : 70;
  const bodyStroke = isJumping ? "#7C3AED" : "#0F172A";
  const isSmiling = isJumping || isBubbleVisible;

  return (
    <aside
      className="fixed bottom-3.5 left-5 z-30 hidden flex-col items-start sm:flex"
      aria-label="Node the flowchart buddy"
    >
      <div aria-live="polite">
        {isBubbleVisible && (
          <div
            key={message}
            className="mb-2 ml-2.5 max-w-[15rem] rounded-[12px] rounded-bl-[3px] bg-slate-950 px-3.5 py-2.5 text-[13px] font-medium leading-normal text-white shadow-xl motion-safe:animate-[about-pop_0.25s_ease_both]"
          >
            {message}
          </div>
        )}
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        title="Click me!"
        className="cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
        aria-label="Talk to Node the flowchart buddy"
      >
        <svg
          width="150"
          height="92"
          viewBox="0 0 160 98"
          aria-hidden="true"
          className="overflow-visible"
          style={{
            animation:
              isJumping && motionEnabled ? "about-jump 0.65s ease" : undefined,
            transformOrigin: "50% 100%",
          }}
        >
          {/* Arrow tail: a little edge trailing behind */}
          <g style={{ animation: bobAnimation("-0.35s") }}>
            <path
              d={`M16 74 Q30 ${tailLift} 44 72`}
              stroke="#2563EB"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4 6"
            />
            <circle
              cx="14"
              cy="74"
              r="5"
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
            />
          </g>

          {/* Body: rounded flowchart node */}
          <g style={{ animation: bobAnimation("0s") }}>
            <rect
              x="44"
              y="26"
              width="92"
              height="64"
              rx="18"
              fill="rgba(37,99,235,0.5)"
              stroke={bodyStroke}
              strokeWidth="3.5"
            />
            <rect
              x="52"
              y="34"
              width="76"
              height="10"
              rx="5"
              fill="rgba(255,255,255,0.55)"
            />
            {/* Connection ports */}
            <circle cx="44" cy="58" r="4" fill="#2563EB" />
            <circle cx="136" cy="58" r="4" fill="#2563EB" />
            <circle cx="90" cy="26" r="4" fill="#2563EB" />
            {/* Eyes */}
            <g
              style={{
                animation: motionEnabled
                  ? "about-eyeblink 4.2s infinite"
                  : undefined,
                transformOrigin: "90px 60px",
              }}
            >
              <circle
                cx="76"
                cy="60"
                r="6"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <circle
                cx="104"
                cy="60"
                r="6"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <circle
                cx={76 + pupilOffset.x}
                cy={60 + pupilOffset.y}
                r="2.8"
                fill="#0F172A"
              />
              <circle
                cx={104 + pupilOffset.x}
                cy={60 + pupilOffset.y}
                r="2.8"
                fill="#0F172A"
              />
            </g>
            {/* Cheeks + mouth */}
            <circle cx="68" cy="71" r="3" fill="#BFDBFE" />
            <circle cx="112" cy="71" r="3" fill="#BFDBFE" />
            <path
              d={isSmiling ? "M80 73 Q90 83 100 73" : "M83 74 Q90 79 97 74"}
              stroke="#0F172A"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Forward arrow: points where you're heading */}
          <g style={{ animation: bobAnimation("-0.15s") }}>
            <path
              d="M140 58 H152"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M148 52 L156 58 L148 64"
              stroke="#2563EB"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </button>
    </aside>
  );
}
