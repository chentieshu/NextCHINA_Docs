import React, { useEffect, useRef, useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/utils";

const CORNER = 6;
const DASH =
  "repeating-linear-gradient(to top, transparent 0 2px, currentColor 2px 4px)";

export type HookSidebarItem =
  | string
  | {
      label: string;
      href?: string;
      id?: string;
      sublabel?: string;
      level?: number;
      badge?: string;
      rightAction?: React.ReactNode;
    };

export type HookSidebarProps = Omit<ComponentProps<"nav">, "onChange"> & {
  items: HookSidebarItem[];
  label?: string;
  value?: number;
  defaultValue?: number;
  onChange?: (index: number, item: HookSidebarItem) => void;
  color?: string;
  dashed?: boolean;
  isLight?: boolean;
};

const hrefOf = (item: HookSidebarItem) =>
  typeof item === "string" ? undefined : item.href;

const labelOf = (item: HookSidebarItem) =>
  typeof item === "string" ? item : item.label;

const Rail = ({
  from = 0,
  y,
  visible,
  color,
  dashed,
  className,
}: {
  from?: number;
  y: number | null;
  visible: boolean;
  color?: string;
  dashed: boolean;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const travel = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

  return (
    <motion.span
      aria-hidden
      initial={false}
      style={{ color }}
      animate={{ opacity: visible && y !== null ? 1 : 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.2 }}
      className={cn("pointer-events-none absolute inset-0 z-10", className)}
    >
      <motion.span
        initial={false}
        animate={{ top: from, height: Math.max(0, (y ?? 0) - CORNER - from) }}
        transition={travel}
        style={
          dashed
            ? { backgroundImage: DASH }
            : { backgroundColor: "currentColor" }
        }
        className="absolute left-0.5 w-px"
      />
      <motion.svg
        initial={false}
        animate={{ top: (y ?? 0) - CORNER }}
        transition={travel}
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        className="absolute left-0.5"
      >
        <path
          d="M0.5 0a6 6 0 0 0 6 6H12"
          stroke="currentColor"
          strokeDasharray={dashed ? "2 2" : undefined}
        />
      </motion.svg>
    </motion.span>
  );
};

export function HookSidebar({
  items,
  label,
  value,
  defaultValue = 0,
  onChange,
  color,
  dashed = true,
  isLight = false,
  className,
  ...props
}: HookSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [centers, setCenters] = useState<number[]>([]);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);

  // Default color based on theme if not specified
  const effectiveColor = color || (isLight ? "#171717" : "#f5f5f5");

  const activeIndex = value ?? internalValue;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () =>
      setCenters(
        itemRefs.current.map((el) =>
          el ? el.offsetTop + el.offsetHeight / 2 : 0
        )
      );

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length, items]);

  const activeY = activeIndex < 0 ? null : centers[activeIndex] ?? null;
  const hoverY = hoverIndex === null ? null : centers[hoverIndex] ?? null;

  // above the active row the accent line already covers the span, so draw only the corner
  const hoverFrom =
    activeY !== null && hoverY !== null && hoverY <= activeY
      ? Math.max(0, hoverY - CORNER)
      : (activeY ?? 0);

  const select = (index: number) => {
    if (value === undefined) setInternalValue(index);
    onChange?.(index, items[index]);
  };

  return (
    <nav
      data-slot="hook-sidebar"
      aria-label={label}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {label && (
        <span
          data-slot="hook-sidebar-label"
          className={cn(
            "pb-3 pl-0.5 pr-2 font-mono text-xs font-semibold uppercase tracking-wider",
            isLight ? "text-neutral-800" : "text-neutral-200"
          )}
        >
          {label}
        </span>
      )}

      <div
        ref={listRef}
        onMouseLeave={() => setPointerInside(false)}
        className="relative flex flex-col gap-0.5"
      >
        <Rail
          from={hoverFrom}
          y={hoverY}
          visible={(pointerInside || focusInside) && hoverIndex !== activeIndex}
          dashed={dashed}
          className={isLight ? "text-neutral-400" : "text-neutral-600"}
        />
        <Rail
          y={activeY}
          visible={activeY !== null}
          color={effectiveColor}
          dashed={dashed}
        />

        {items.map((item, index) => {
          const text = labelOf(item);
          const href = hrefOf(item);
          const itemObj = typeof item === "string" ? null : item;
          const isActive = index === activeIndex;
          const setRef = (el: HTMLElement | null) => {
            itemRefs.current[index] = el;
          };

          const rowProps = {
            "data-slot": "hook-sidebar-item",
            "data-active": isActive,
            onMouseEnter: () => {
              setHoverIndex(index);
              setPointerInside(true);
            },
            onFocus: () => {
              setHoverIndex(index);
              setFocusInside(true);
            },
            onBlur: () => setFocusInside(false),
            onClick: (e: React.MouseEvent) => {
              if (href && href.startsWith("#")) {
                e.preventDefault();
              }
              select(index);
            },
            className: cn(
              "group/hook-item rounded-lg py-1.5 pl-5 pr-2 text-left text-xs transition-colors duration-200 motion-reduce:transition-none flex items-center justify-between",
              itemObj?.level === 3 && "pl-7 text-[11px]",
              isActive
                ? isLight
                  ? "text-neutral-950 font-bold bg-neutral-200/50"
                  : "text-neutral-100 font-bold bg-neutral-900/60"
                : isLight
                ? "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            ),
          };

          const content = (
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="truncate leading-relaxed">{text}</span>
                {itemObj?.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0",
                      isLight
                        ? "bg-neutral-100 text-neutral-600 border-neutral-300"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800"
                    )}
                  >
                    {itemObj.badge}
                  </span>
                )}
              </div>
              {itemObj?.sublabel && (
                <div
                  className={cn(
                    "text-[10px] font-mono mt-0.5",
                    isActive
                      ? isLight
                        ? "text-neutral-500"
                        : "text-neutral-400"
                      : isLight
                      ? "text-neutral-400"
                      : "text-neutral-500"
                  )}
                >
                  {itemObj.sublabel}
                </div>
              )}
            </div>
          );

          return (
            <div key={`${index}-${text}`} className="relative flex items-center w-full">
              {href ? (
                <a
                  {...rowProps}
                  ref={setRef}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(rowProps.className, "w-full")}
                >
                  {content}
                </a>
              ) : (
                <button
                  {...rowProps}
                  ref={setRef}
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  className={cn(rowProps.className, "w-full")}
                >
                  {content}
                </button>
              )}
              {itemObj?.rightAction && (
                <div
                  className="absolute right-2 z-20 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {itemObj.rightAction}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
export default HookSidebar;
