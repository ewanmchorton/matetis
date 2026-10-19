import type { ElementId } from "@/entities/element";

import type { ElementScore } from "../model/calculate";
import { elementColors, elementNames } from "./element-scores";

/** Расположение по схеме Жанны: Огонь сверху, дальше по часовой стрелке. */
const clockwise: ElementId[] = ["fire", "earth", "metal", "water", "wood"];

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 112;
const NODE_RADIUS = 36;
/** На сколько градусов стрелка отступает от кружка стихии. */
const GAP = 24;

function point(angle: number, radius = RADIUS) {
  const radians = (angle * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
}

const angleOf = (index: number) => -90 + index * 72;

/** Круг Усин: пять стихий и стрелки порождения по часовой стрелке. В кружке — количество цифр стихии. */
export function WuXingCircle({ scores }: { scores: ElementScore[] }) {
  const countOf = (element: ElementId) => scores.find((score) => score.element === element)?.count ?? 0;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-80"
      role="img"
      aria-label={`Круг Усин: ${clockwise.map((element) => `${elementNames[element]} ${countOf(element)}`).join(", ")}`}
    >
      <defs>
        <marker id="wu-xing-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#9b4a52" />
        </marker>
      </defs>

      {clockwise.map((element, index) => {
        const from = point(angleOf(index) + GAP);
        const to = point(angleOf(index + 1) - GAP);
        return (
          <path
            key={element}
            d={`M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 0 1 ${to.x} ${to.y}`}
            fill="none"
            stroke="#9b4a52"
            strokeWidth="2"
            markerEnd="url(#wu-xing-arrow)"
          />
        );
      })}

      {clockwise.map((element, index) => {
        const { x, y } = point(angleOf(index));
        const colors = elementColors[element];
        return (
          <g key={element}>
            <circle cx={x} cy={y} r={NODE_RADIUS} fill={colors.fill} stroke={colors.stroke} strokeWidth="2" />
            <text x={x} y={y - 6} textAnchor="middle" fontSize="11" fill={colors.text}>
              {elementNames[element]}
            </text>
            <text x={x} y={y + 15} textAnchor="middle" fontSize="20" fontWeight="600" fill={colors.text}>
              {countOf(element)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
