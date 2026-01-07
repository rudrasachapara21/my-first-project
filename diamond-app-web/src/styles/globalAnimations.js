import { keyframes, css } from 'styled-components';

export const diamondPulse = keyframes`
  0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
  50% { transform: scale(1.04); filter: drop-shadow(0 8px 24px rgba(0,0,0,0.25)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
`;

export const glowPulse = keyframes`
  0% { box-shadow: 0 0 0 rgba(0,0,0,0); }
  50% { box-shadow: 0 10px 40px rgba(255, 200, 60, 0.08); }
  100% { box-shadow: 0 0 0 rgba(0,0,0,0); }
`;

export const hoverLift = css`
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  &:hover { transform: translateY(-6px); }
`;

export default {
  diamondPulse,
  glowPulse,
  hoverLift
};
