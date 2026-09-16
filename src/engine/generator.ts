import { AstNode, BlockNode } from '../grammar/ast';
import {
  resolveBlock,
  PROPERTIES,
  POSITION_KEYWORDS,
  KEYWORD_CSS,
  isParametricKeyword,
  parseParametric,
  pageToFilename,
  ICONS,
} from './registry';

const VOID_TAGS = new Set(['img', 'input']);

export const BASE_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
img { display: block; object-fit: cover; }
button { font-family: inherit; }
.meeel-divider-line {
  flex: 1;
  height: 1px;
  background: currentColor;
  opacity: 0.3;
}
/* ============ Video ============ */
.meeel-video {
  display: block;
  width: 100%;
  max-width: 640px;
  border-radius: var(--video-radius, 16px);
  overflow: hidden;
  background: #000;
  box-shadow: var(--video-shadow, 0 8px 24px rgba(0,0,0,0.15));
}
.meeel-video video,
.meeel-video iframe {
  display: block;
  width: 100%;
  height: auto;
  border: none;
  aspect-ratio: 16 / 9;
  background: #000;
}
.meeel-video-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 100%;
}

/* ============ Color Bar (full) ============ */
.meeel-colorbar {
  display: block;
  width: 100%;
  max-width: 520px;
  background: var(--colorbar-bg, #1a1f2e);
  border-radius: 16px;
  padding: 24px;
  font-family: inherit;
  color: #ffffff;
  user-select: none;
  -webkit-user-select: none;
}
.meeel-colorbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}
.meeel-colorbar-hint {
  font-size: 13px;
  color: #8892a6;
  margin-bottom: 20px;
}
.meeel-colorbar-track {
  position: relative;
  width: 100%;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(to right,
    hsl(0,90%,60%) 0%,
    hsl(30,90%,60%) 12.5%,
    hsl(60,90%,60%) 25%,
    hsl(120,90%,60%) 37.5%,
    hsl(180,90%,60%) 50%,
    hsl(210,90%,60%) 62.5%,
    hsl(240,90%,60%) 75%,
    hsl(300,90%,60%) 87.5%,
    hsl(330,90%,60%) 100%);
}
.meeel-colorbar-track::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 100%;
  background: radial-gradient(circle at 70% 50%,
    hsl(340,90%,60%) 0%,
    hsl(0,90%,60%) 40%,
    transparent 75%);
  pointer-events: none;
}
.meeel-colorbar-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  width: 48px;
  height: 48px;
  border: 3px solid #ffffff;
  border-radius: 12px;
  transform: translate(-50%, -50%);
  background: transparent;
  pointer-events: none;
  transition: left 0.08s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.meeel-colorbar-check {
  color: #ffffff;
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}
.meeel-colorbar-info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
  background: rgba(255,255,255,0.04);
  border-radius: 12px;
  padding: 12px 14px;
}
.meeel-colorbar-swatch {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
  background: #EC4899;
  box-shadow: 0 0 18px 2px rgba(236,72,153,0.5);
  transition: background 0.1s ease, box-shadow 0.1s ease;
}
.meeel-colorbar-meta {
  flex: 1;
  min-width: 0;
}
.meeel-colorbar-hex {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.02em;
  font-family: ui-monospace, monospace;
}
.meeel-colorbar-name {
  font-size: 12px;
  color: #8892a6;
  margin-top: 2px;
}
.meeel-colorbar-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.06);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.meeel-colorbar-copy:hover {
  background: rgba(255,255,255,0.12);
}
.meeel-colorbar-copy.copied {
  background: rgba(22,163,74,0.25);
  color: #86efac;
}

/* ============ Color Bar - Segmented (custom colors) ============ */
.meeel-colorbar-segments {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
}
.meeel-colorbar-segment {
  position: absolute;
  top: 0;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s ease;
}
.meeel-colorbar-segment:hover {
  filter: brightness(1.1);
}
.meeel-colorbar-segment-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 3px solid #ffffff;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  box-shadow: 0 4px 10px rgba(0,0,0,0.4);
  color: #ffffff;
}
.meeel-colorbar-segment-check svg {
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}
.meeel-mini-colorbar-segment-check {
  width: 34px;
  height: 34px;
  border-width: 3px;
  border-radius: 9px;
}

/* ============ Mini Color Bar ============ */
.meeel-mini-colorbar {
  display: block;
  width: 220px;
  font-family: inherit;
  user-select: none;
  -webkit-user-select: none;
}
.meeel-mini-colorbar-track {
  position: relative;
  width: 100%;
  height: 44px;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(to right,
    hsl(0,90%,60%) 0%,
    hsl(30,90%,60%) 12.5%,
    hsl(60,90%,60%) 25%,
    hsl(120,90%,60%) 37.5%,
    hsl(180,90%,60%) 50%,
    hsl(210,90%,60%) 62.5%,
    hsl(240,90%,60%) 75%,
    hsl(300,90%,60%) 87.5%,
    hsl(330,90%,60%) 100%);
}
.meeel-mini-colorbar-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  width: 40px;
  height: 40px;
  border: 3px solid #ffffff;
  border-radius: 12px;
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,0.06);
  pointer-events: none;
  box-shadow: 0 4px 10px rgba(0,0,0,0.35);
  transition: left 0.08s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.meeel-mini-colorbar-check {
  color: #ffffff;
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}
.meeel-mini-colorbar-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  background: #1a1f2e;
  border-radius: 12px;
  padding: 10px 14px;
}
.meeel-mini-colorbar-swatch {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
  background: #BFBFBF;
  box-shadow: 0 0 14px 2px rgba(191,191,191,0.4);
  transition: background 0.1s ease, box-shadow 0.1s ease;
}
.meeel-mini-colorbar-hex {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.02em;
  font-family: ui-monospace, monospace;
}

/* ============ Custom Select ============ */
.meeel-cselect {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  font-family: inherit;
  user-select: none;
  -webkit-user-select: none;
}
.meeel-cselect-label {
  font-size: 13px;
  font-weight: 600;
  color: inherit;
  padding-left: 2px;
}
.meeel-cselect-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: var(--cselect-bg, #f5f5f5);
  color: var(--cselect-color, #1a1a1a);
  border: 1px solid var(--cselect-border, #e0e0e0);
  border-radius: var(--cselect-radius, 8px);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  text-align: left;
  width: 100%;
}
.meeel-cselect-btn:hover {
  background: var(--cselect-bg-hover, #ececec);
}
.meeel-cselect.open .meeel-cselect-btn {
  border-color: var(--cselect-focus, #0a84ff);
  background: var(--cselect-bg-focus, #ffffff);
}
.meeel-cselect-arrow {
  flex-shrink: 0;
  transition: transform 0.2s ease;
  color: currentColor;
  opacity: 0.6;
}
.meeel-cselect.open .meeel-cselect-arrow {
  transform: rotate(180deg);
}
.meeel-cselect-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--cselect-menu-bg, #ffffff);
  border: 1px solid var(--cselect-menu-border, #e0e0e0);
  border-radius: var(--cselect-radius, 8px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 6px;
  z-index: 100;
  max-height: 280px;
  overflow-y: auto;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.meeel-cselect.open .meeel-cselect-menu {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.meeel-cselect-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: calc(var(--cselect-radius, 8px) - 2px);
  font-size: 14px;
  font-weight: 500;
  color: var(--cselect-menu-color, #1a1a1a);
  cursor: pointer;
  transition: background 0.12s ease;
}
.meeel-cselect-option:hover {
  background: var(--cselect-option-hover, rgba(10, 132, 255, 0.10));
}
.meeel-cselect-option.active {
  background: var(--cselect-option-active, rgba(10, 132, 255, 0.14));
  color: var(--cselect-focus, #0a84ff);
  font-weight: 600;
}
.meeel-cselect-option-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  object-fit: contain;
  display: block;
}
.meeel-cselect-option-check {
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  color: var(--cselect-focus, #0a84ff);
}
.meeel-cselect-option.active .meeel-cselect-option-check {
  opacity: 1;
}

/* ============ Select (native dropdown) ============ */
.meeel-select {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  font-family: inherit;
}
.meeel-select-label {
  font-size: 13px;
  font-weight: 600;
  color: inherit;
  padding-left: 2px;
}
.meeel-select select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  padding: 10px 36px 10px 12px;
  background-color: var(--select-bg, #f5f5f5);
  color: var(--select-color, #1a1a1a);
  border: 1px solid var(--select-border, #e0e0e0);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px 14px;
}
.meeel-select select:hover {
  background-color: var(--select-bg-hover, #ececec);
}
.meeel-select select:focus {
  border-color: var(--select-focus, #0a84ff);
  background-color: var(--select-bg-focus, #ffffff);
}
.meeel-select select option {
  padding: 8px;
  background: white;
  color: #1a1a1a;
}

/* ============ Checkbox + Radio ============ */
.meeel-checkbox,
.meeel-radio {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  font-size: 14px;
}
.meeel-checkbox input,
.meeel-radio input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.meeel-checkbox-box {
  position: relative;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid #999;
  border-radius: 5px;
  background: white;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.meeel-checkbox-box::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 6px;
  height: 11px;
  border: solid white;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.15s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.meeel-checkbox input:checked + .meeel-checkbox-box {
  background: var(--check-color, #0a84ff);
  border-color: var(--check-color, #0a84ff);
}
.meeel-checkbox input:checked + .meeel-checkbox-box::before {
  transform: rotate(45deg) scale(1);
}

.meeel-radio-circle {
  position: relative;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid #999;
  border-radius: 50%;
  background: white;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.meeel-radio-circle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.15s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.meeel-radio input:checked + .meeel-radio-circle {
  background: var(--check-color, #0a84ff);
  border-color: var(--check-color, #0a84ff);
}
.meeel-radio input:checked + .meeel-radio-circle::before {
  transform: translate(-50%, -50%) scale(1);
}

.meeel-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============ Slider ============ */
.meeel-slider {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 320px;
  font-family: inherit;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.meeel-slider-track {
  position: relative;
  flex: 1;
  height: 6px;
  background: var(--track-color, #e0e0e0);
  border-radius: 999px;
  overflow: visible;
}
.meeel-slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--fill-color, #0a84ff);
  border-radius: 999px;
  pointer-events: none;
  transition: width 0.05s linear;
}
.meeel-slider input {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  height: 24px;
  margin: 0;
  padding: 0;
  background: transparent;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  z-index: 2;
}
.meeel-slider-thumb {
  position: absolute;
  top: 50%;
  left: 0;
  width: 18px;
  height: 18px;
  background: white;
  border: 2px solid var(--fill-color, #0a84ff);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  pointer-events: none;
  transition: left 0.05s linear;
  z-index: 1;
}
.meeel-slider-label {
  font-size: 13px;
  font-weight: 500;
  color: inherit;
  white-space: nowrap;
}
.meeel-slider-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--fill-color, #0a84ff);
  min-width: 36px;
  text-align: right;
  font-family: ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

/* ============ Progress bar ============ */
.meeel-progress {
  position: relative;
  width: 100%;
  height: 8px;
  background: var(--track-color, #e0e0e0);
  border-radius: 999px;
  overflow: hidden;
}
.meeel-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--fill-color, #0a84ff);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* ============ Toggle switch ============ */
.meeel-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.meeel-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.meeel-toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--off-color, #555);
  border-radius: 999px;
  transition: background 0.22s ease;
  flex-shrink: 0;
}
.meeel-toggle-slider::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.meeel-toggle input:checked + .meeel-toggle-slider {
  background: var(--on-color, #16a34a);
}
.meeel-toggle input:checked + .meeel-toggle-slider::before {
  transform: translateX(20px);
}
.meeel-toggle-label {
  font-size: 14px;
  color: inherit;
}
/* ============ Sidebar ============ */
.meeel-sidebar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--sidebar-bg, #1a1a1a);
  border-radius: var(--sidebar-radius, 12px);
  font-family: inherit;
  width: var(--sidebar-width, 240px);
  min-width: var(--sidebar-width, 240px);
}
.meeel-sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--sidebar-color, #b0b0b0);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.meeel-sidebar-item:hover {
  background: var(--sidebar-hover, rgba(255,255,255,0.06));
  color: var(--sidebar-color-hover, #ffffff);
}
.meeel-sidebar-item.selected {
  background: var(--sidebar-selected-bg, rgba(10,132,255,0.15));
  color: var(--sidebar-selected-color, #0a84ff);
  font-weight: 600;
}
.meeel-sidebar-item-icon {
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
  filter: var(--sidebar-icon-filter, none);
}
.meeel-sidebar-item.selected .meeel-sidebar-item-icon {
  filter: var(--sidebar-icon-filter-selected, none);
}
.meeel-sidebar-item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============ Charts ============ */
.meeel-chart {
  display: block;
  font-family: inherit;
  background: var(--chart-bg, #ffffff);
  border: 1px solid var(--chart-border, #e5e5e5);
  border-radius: var(--chart-radius, 12px);
  padding: 18px;
  width: 100%;
}
.meeel-chart svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.meeel-chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: var(--chart-label-color, #888888);
  font-weight: 500;
  gap: 4px;
}
.meeel-chart-labels span {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meeel-chart-donut-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto;
}
.meeel-chart-donut-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--chart-color, #1a1a1a);
}
.meeel-chart-donut-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
}
.meeel-chart-donut-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
  margin-top: 2px;
}

/* ============ Modal ============ */
.meeel-modal {
  display: inline-block;
  font-family: inherit;
}
.meeel-modal > input {
  display: none;
}
.meeel-modal-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--modal-trigger-bg, #0a84ff);
  color: var(--modal-trigger-color, #ffffff);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: var(--modal-trigger-radius, 8px);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.meeel-modal-trigger:hover {
  background: var(--modal-trigger-hover, #0070e0);
}
.meeel-modal-trigger:active {
  transform: scale(0.97);
}
.meeel-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 9000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
}
.meeel-modal > input:checked ~ .meeel-modal-overlay {
  opacity: 1;
  pointer-events: auto;
}
.meeel-modal-content {
  background: var(--modal-bg, #ffffff);
  color: var(--modal-color, #1a1a1a);
  border-radius: var(--modal-radius, 14px);
  width: 100%;
  max-width: 420px;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
  transform: translateY(12px) scale(0.98);
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}
.meeel-modal > input:checked ~ .meeel-modal-overlay .meeel-modal-content {
  transform: translateY(0) scale(1);
}
.meeel-modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--modal-color, #1a1a1a);
}
.meeel-modal-body {
  font-size: 14px;
  line-height: 1.6;
  color: var(--modal-color, #1a1a1a);
  opacity: 0.85;
  margin-bottom: 20px;
}
.meeel-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 16px;
  background: var(--modal-close-bg, #1a1a1a);
  color: var(--modal-close-color, #ffffff);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
}
.meeel-modal-close:hover {
  background: var(--modal-close-hover, #333333);
}
.meeel-modal-x {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--modal-color, #1a1a1a);
  opacity: 0.5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
}
.meeel-modal-x:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.06);
}
.meeel-modal-content {
  position: relative;
}

/* ============ Accordion ============ */
.meeel-accordion {
  display: block;
  width: 100%;
  font-family: inherit;
  background: var(--accordion-bg, #ffffff);
  border: 1px solid var(--accordion-border, #e5e5e5);
  border-radius: var(--accordion-radius, 12px);
  overflow: hidden;
}
.meeel-accordion-item {
  border-bottom: 1px solid var(--accordion-border, #e5e5e5);
}
.meeel-accordion-item:last-child {
  border-bottom: none;
}
.meeel-accordion-item > input {
  display: none;
}
.meeel-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--accordion-color, #1a1a1a);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s ease;
}
.meeel-accordion-header:hover {
  background: var(--accordion-header-hover, rgba(0,0,0,0.03));
}
.meeel-accordion-arrow {
  flex-shrink: 0;
  color: var(--accordion-arrow, #888888);
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.meeel-accordion-item > input:checked ~ .meeel-accordion-header .meeel-accordion-arrow {
  transform: rotate(180deg);
}
.meeel-accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.meeel-accordion-item > input:checked ~ .meeel-accordion-content {
  max-height: 600px;
}
.meeel-accordion-body {
  padding: 0 20px 18px 20px;
  font-size: 14px;
  color: var(--accordion-color, #1a1a1a);
  line-height: 1.6;
  opacity: 0.85;
}

/* ============ Badge ============ */
.meeel-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--badge-color, #ffffff);
  background: var(--badge-bg, #0a84ff);
  border-radius: 999px;
  line-height: 1.4;
  white-space: nowrap;
}

/* ============ Tooltip ============ */
.meeel-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: help;
}
.meeel-tooltip-trigger {
  display: inline-block;
  color: inherit;
}
.meeel-tooltip-text {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  padding: 6px 12px;
  background: var(--tooltip-bg, #1a1a1a);
  color: var(--tooltip-color, #ffffff);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.meeel-tooltip-text::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--tooltip-bg, #1a1a1a);
}
.meeel-tooltip:hover .meeel-tooltip-text,
.meeel-tooltip:focus-within .meeel-tooltip-text {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ============ Tabs ============ */
.meeel-tabs {
  display: block;
  width: 100%;
  font-family: inherit;
  background: var(--tabs-bg, #ffffff);
  border: 1px solid var(--tabs-border, #e5e5e5);
  border-radius: var(--tabs-radius, 12px);
  overflow: hidden;
}
.meeel-tabs > input {
  display: none;
}
.meeel-tab-headers {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  background: var(--tabs-header-bg, #f7f7f7);
  border-bottom: 1px solid var(--tabs-border, #e5e5e5);
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.meeel-tab-headers::-webkit-scrollbar {
  display: none;
}
.meeel-tab-headers label {
  flex-shrink: 0;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--tabs-label-color, #666666);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}
.meeel-tab-headers label:hover {
  color: var(--tabs-label-hover, #1a1a1a);
  background: var(--tabs-label-hover-bg, rgba(0,0,0,0.03));
}
.meeel-tab-panel {
  display: none;
  padding: var(--tabs-padding, 20px);
  color: var(--tabs-color, #1a1a1a);
  font-size: 14px;
  line-height: 1.55;
}

/* ============ Table ============ */
.meeel-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: inherit;
  font-size: 14px;
  background: var(--table-bg, #ffffff);
  border: 1px solid var(--table-border, #e5e5e5);
  border-radius: 10px;
  overflow: hidden;
}
.meeel-table th,
.meeel-table td {
  padding: 12px 16px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--table-border, #e5e5e5);
}
.meeel-table th {
  background: var(--table-header-bg, #f7f7f7);
  color: var(--table-header-color, #555555);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.meeel-table td {
  color: var(--table-color, #1a1a1a);
  font-weight: 500;
}
.meeel-table tr:last-child td {
  border-bottom: none;
}
.meeel-table tbody tr:hover td {
  background: var(--table-row-hover, #fafafa);
}
.meeel-table .meeel-table-cell-right {
  text-align: right;
}
.meeel-table .meeel-table-cell-center {
  text-align: center;
}`;

function isKind(id: string, kind: string): boolean {
  if (id === kind) return true;
  if (id.startsWith(kind + '-')) return true;
  if (id.endsWith('-' + kind)) return true;
  if (id.includes('-') && id.split('-').includes(kind)) return true;
  return false;
}

type ModeKind = 'mobile' | 'tablet' | 'desktop';

// Collect on-click handlers during block generation
let collectedHandlers: Array<{ elementId: string; actions: string[] }> = [];
let collectedTimers: Array<{ period: number; actions: string[] }> = [];

function getModeKind(name: string): ModeKind | null {
  if (name === 'mobile-mode' || name.startsWith('mobile-mode-')) return 'mobile';
  if (name === 'tablet-mode' || name.startsWith('tablet-mode-')) return 'tablet';
  if (name === 'desktop-mode' || name.startsWith('desktop-mode-')) return 'desktop';
  return null;
}

type CSSBucket = Record<string, Record<string, string>>;

export interface GenerateParts {
  html: string;
  css: string;
  js: string;          // generated JavaScript
  fullHtml: string;    // for preview — CSS + JS embedded
  htmlFile: string;    // for publish — links to external CSS + JS files
}

export interface PageOutput {
  name: string;
  filename: string;      // e.g. "index.html"
  cssFilename: string;   // e.g. "style.css"
  jsFilename: string;    // e.g. "script.js"
  label: string;
  html: string;          // embedded HTML (for preview)
  htmlFile: string;      // external-linked HTML (for publish/download)
  css: string;           // the CSS for this page
  js: string;            // the JS for this page
}

/* ============ MAIN: generate all pages ============ */

export function generatePages(root: BlockNode): PageOutput[] {
  const topBlocks: BlockNode[] = [];
  for (const child of root.children) {
    if (child.kind === 'block') topBlocks.push(child);
  }
  if (topBlocks.length === 0) return [];

  return topBlocks.map((b) => {
    const singleRoot: BlockNode = {
      kind: 'block',
      name: '<root>',
      children: [b],
      line: 0,
    };
    const { filename, label } = pageFilename(b.name);

    let cssFilename: string;
    let jsFilename: string;
    if (b.name === 'page') {
      cssFilename = 'style.css';
      jsFilename = 'script.js';
    } else {
      const base = filename.replace(/\.html$/, '');
      cssFilename = base + '.css';
      jsFilename = base + '.js';
    }

    const parts = generateParts(singleRoot, cssFilename, jsFilename);

    return {
      name: b.name,
      filename,
      cssFilename,
      jsFilename,
      label,
      html: parts.fullHtml,
      htmlFile: parts.htmlFile,
      css: parts.css,
      js: parts.js,
    };
  });
}

function pageFilename(name: string): { filename: string; label: string } {
  if (name === 'page') return { filename: 'index.html', label: 'Page' };
  let base = name;
  if (name.endsWith('-page')) base = name.slice(0, -5);
  if (!base) base = name;
  const filename = base + '.html';
  const label =
    base
      .split('-')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ') || 'Page';
  return { filename, label };
}

/* ============ generateParts — handles responsive modes ============ */

export function generateParts(
  root: BlockNode,
  cssFilename = 'style.css',
  jsFilename = 'script.js'
): GenerateParts {
  collectedHandlers = [];
  collectedTimers = [];
  const page = root.children.find((c) => c.kind === 'block') as BlockNode | undefined;
  if (!page) {
    return {
      html: '',
      css: BASE_CSS,
      js: '',
      fullHtml: wrapHtml('', BASE_CSS, ''),
      htmlFile: wrapHtmlExternal('', cssFilename, jsFilename),
    };
  }

  // Separate mode blocks + conditional blocks from regular children
  const defaultChildren: AstNode[] = [];
  const modeBlocks: BlockNode[] = [];
  const conditionalBlocks: BlockNode[] = [];
  for (const child of page.children) {
    if (child.kind === 'block' && getModeKind(child.name)) {
      modeBlocks.push(child);
    } else if (
      child.kind === 'block' &&
      (child.name === 'dark-mode' || child.name === 'toggle-active')
    ) {
      conditionalBlocks.push(child);
    } else {
      defaultChildren.push(child);
    }
  }

  // Generate page HTML/CSS with only default children
  const cssRules: CSSBucket = {};
  const pageWithDefaults: BlockNode = { ...page, children: defaultChildren };
  const html = generateBlock(pageWithDefaults, cssRules, '');

  // Collect all default element names (for override matching)
  const defaultNames = new Set<string>();
  for (const child of defaultChildren) {
    if (child.kind === 'block') {
      defaultNames.add(child.name);
      collectNames(child, defaultNames);
    }
  }

  // Process each mode block
  const modeCss: Record<ModeKind, CSSBucket> = { mobile: {}, tablet: {}, desktop: {} };
  const modeOnlyElements: Record<ModeKind, BlockNode[]> = {
    mobile: [], tablet: [], desktop: [],
  };

  for (const modeBlock of modeBlocks) {
    const kind = getModeKind(modeBlock.name);
    if (!kind) continue;
    for (const child of modeBlock.children) {
      if (child.kind !== 'block') continue;
      if (defaultNames.has(child.name)) {
        // Override — merge into mode bucket
        const overrideCss = collectOverrideCss(child);
        modeCss[kind][child.name] = {
          ...(modeCss[kind][child.name] || {}),
          ...overrideCss,
        };
        collectNestedOverrides(child, modeCss[kind], defaultNames);
      } else {
        // Mode-only element
        modeOnlyElements[kind].push(child);
      }
    }
  }

  // Generate HTML + CSS for mode-only elements (hidden by default)
  for (const kind of ['mobile', 'tablet', 'desktop'] as const) {
    for (const el of modeOnlyElements[kind]) {
      // Generate HTML + CSS for this element
      const elCss: CSSBucket = {};
      const elHtml = generateBlock(el, elCss, '  ');

      // Add to page HTML — insert just before closing </div>
      // Simpler: we regenerate by appending. Skip for v1, or handle by HTML string manipulation.
      // For now, put mode-only elements inside their own wrapper div that is hidden by default.
      const wrapperId = `__mode-${kind}-${el.name}`;
      const wrapperHtml = `  <div id="${wrapperId}" style="display: contents">\n  ${elHtml}\n  </div>`;
      const wrapperCss: Record<string, string> = { display: 'contents' };
      cssRules[wrapperId] = wrapperCss;

      // Mark the element itself as display:none by default
      const realId = el.name;
      const realCss = elCss[realId] || {};
      const originalDisplay = realCss['display'] || 'block';
      cssRules[realId] = { ...realCss, display: 'none' };
      modeCss[kind][realId] = {
        ...(modeCss[kind][realId] || {}),
        display: originalDisplay,
      };

      // Append wrapper HTML to page — need to inject before closing </div>
      // We'll handle this via post-processing
      (html as any); // suppress unused
      // Actually simpler: store for later injection
      if (!modeOnlyHtml[kind]) modeOnlyHtml[kind] = [];
      modeOnlyHtml[kind].push(wrapperHtml);
    }
  }

  // Build final HTML by injecting mode-only wrappers before last </div>
  let finalHtml = html;
  const allModeOnlyHtml = [
    ...(modeOnlyHtml.mobile || []),
    ...(modeOnlyHtml.tablet || []),
    ...(modeOnlyHtml.desktop || []),
  ];
  if (allModeOnlyHtml.length > 0) {
    const lastClose = finalHtml.lastIndexOf('</div>');
    if (lastClose !== -1) {
      finalHtml =
        finalHtml.slice(0, lastClose) +
        allModeOnlyHtml.join('\n') +
        '\n' +
        finalHtml.slice(lastClose);
    }
  }

  // Global auto-stack: rows become columns on mobile (unless user overrides)
  // We add this as low-priority — user's mobile-mode overrides still win via CSS order.
  const globalMobileRules: Record<string, string> = {};
  const globalMobileBucket: CSSBucket = {};
  for (const name of Object.keys(cssRules)) {
    if (isKind(name, 'row') || isKind(name, 'profile-row') || isKind(name, 'buttons-row') || isKind(name, 'action-row')) {
      // Only if user did NOT explicitly override this row in mobile-mode
      if (!modeCss.mobile[name]) {
        globalMobileBucket[name] = {
          'flex-direction': 'column',
          'gap': '12px',
        };
      }
    }
  }

  // Merge global mobile rules BEFORE user's mobile overrides (so user wins)
  const mergedMobile: CSSBucket = { ...globalMobileBucket };
  for (const [name, rules] of Object.entries(modeCss.mobile)) {
    mergedMobile[name] = { ...(mergedMobile[name] || {}), ...rules };
  }

  // ============ CONDITIONAL (toggle-driven) CSS ============
  const conditionalCssParts: string[] = [];
  for (const condBlock of conditionalBlocks) {
    // Find toggle name from `from-toggle-[X]` property
    let toggleName = '';
    for (const c of condBlock.children) {
      if (c.kind === 'property' && c.name === 'from-toggle') {
        toggleName = c.value;
        break;
      }
    }
    if (!toggleName) continue;

    const prefix = `#page:has(#${toggleName} input:checked)`;

    // For each child block inside dark-mode: generate override CSS
    const lines: string[] = [];
    for (const c of condBlock.children) {
      if (c.kind !== 'block') continue;
      if (c.name === toggleName) continue;
      const overrideCss = collectOverrideCss(c);
      if (Object.keys(overrideCss).length === 0) continue;

      // If name === 'page', target page itself; else descendant
      const selector = c.name === 'page'
        ? `#page:has(#${toggleName} input:checked)`
        : `#page:has(#${toggleName} input:checked) #${c.name}`;

      const body = Object.entries(overrideCss)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      lines.push(`${selector} {\n${body}\n}`);
    }
    if (lines.length > 0) {
      conditionalCssParts.push(
        `/* ============ Conditional (${toggleName}) ============ */\n` + lines.join('\n\n')
      );
    }
  }
  // =========================================================

  const cssText = buildCssText(cssRules, mergedMobile, modeCss.tablet, modeCss.desktop);
  const finalCss = conditionalCssParts.length > 0
    ? cssText + '\n\n' + conditionalCssParts.join('\n\n')
    : cssText;
  const css = `${BASE_CSS}\n\n${finalCss}`;
  const fullHtml = wrapHtml(finalHtml, css);
  const htmlFile = wrapHtmlExternal(finalHtml, cssFilename);

  const js = generateJavaScript(collectedHandlers, collectedTimers);
  const fullHtmlWithJs = wrapHtml(finalHtml, css, js);
  const htmlFileWithJs = wrapHtmlExternal(finalHtml, cssFilename, jsFilename);

  return { html: finalHtml, css, js, fullHtml: fullHtmlWithJs, htmlFile: htmlFileWithJs };
}

const modeOnlyHtml: Record<ModeKind, string[]> = { mobile: [], tablet: [], desktop: [] };

export function generate(root: BlockNode): string {
  return generateParts(root).fullHtml;
}

/* ============ Helpers ============ */

function collectNames(block: BlockNode, names: Set<string>): void {
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (getModeKind(child.name)) continue;
      names.add(child.name);
      collectNames(child, names);
    }
  }
}

function collectOverrideCss(block: BlockNode): Record<string, string> {
  const css: Record<string, string> = {};
  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;

      // Layout direction keywords (responsive override)
      if (kw === 'row') {
        css['flex-direction'] = 'row';
        css['display'] = 'flex';
        continue;
      }
      if (kw === 'column') {
        css['flex-direction'] = 'column';
        css['display'] = 'flex';
        continue;
      }

      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': css['top'] = '0'; break;
          case 'bottom': css['bottom'] = '0'; break;
          case 'left': css['left'] = '0'; break;
          case 'right': css['right'] = '0'; break;
          case 'center': css['left'] = '50%'; break;
          case 'middle': css['top'] = '50%'; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(css, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;

      // Timer property — collect setInterval actions, no CSS output
      const timerMatch = child.name.match(/^every-(\d+)-(millisecond|milliseconds|second|seconds|minute|minutes|hour|hours)$/);
      if (timerMatch) {
        const n = parseInt(timerMatch[1], 10);
        const unit = timerMatch[2];
        let msPerUnit = 1000;
        if (unit.startsWith('millisecond')) msPerUnit = 1;
        else if (unit.startsWith('minute')) msPerUnit = 60000;
        else if (unit.startsWith('hour')) msPerUnit = 3600000;
        const period = n * msPerUnit;
        const acts = child.value.split(/[\n;]/).map((s) => s.trim()).filter(Boolean);
        if (acts.length > 0) collectedTimers.push({ period, actions: acts });
        continue;
      }

      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special) continue;
      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      css[propDef.css] = val;
    }
  }
  return css;
}

function collectNestedOverrides(
  block: BlockNode,
  bucket: CSSBucket,
  defaultNames: Set<string>
): void {
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (defaultNames.has(child.name)) {
        const overrideCss = collectOverrideCss(child);
        bucket[child.name] = {
          ...(bucket[child.name] || {}),
          ...overrideCss,
        };
      }
      collectNestedOverrides(child, bucket, defaultNames);
    }
  }
}

function renderBlock(name: string, rules: Record<string, string>, indent: string): string {
  const body = Object.entries(rules)
    .map(([k, v]) => `${indent}  ${k}: ${v};`)
    .join('\n');
  return `${indent}#${name} {\n${body}\n${indent}}`;
}

function buildCssText(
  defaultRules: CSSBucket,
  mobileRules: CSSBucket,
  tabletRules: CSSBucket,
  desktopRules: CSSBucket
): string {
  const parts: string[] = [];

  for (const [name, rules] of Object.entries(defaultRules)) {
    parts.push(renderBlock(name, rules, ''));
  }

  if (Object.keys(mobileRules).length > 0) {
    const inner = Object.entries(mobileRules)
      .map(([name, rules]) => renderBlock(name, rules, '  '))
      .join('\n\n');
    parts.push(`/* ============ Mobile (0 – 767px) ============ */\n@media (max-width: 767px) {\n${inner}\n}`);
  }

  if (Object.keys(tabletRules).length > 0) {
    const inner = Object.entries(tabletRules)
      .map(([name, rules]) => renderBlock(name, rules, '  '))
      .join('\n\n');
    parts.push(`/* ============ Tablet (768 – 1023px) ============ */\n@media (min-width: 768px) and (max-width: 1023px) {\n${inner}\n}`);
  }

  if (Object.keys(desktopRules).length > 0) {
    const inner = Object.entries(desktopRules)
      .map(([name, rules]) => renderBlock(name, rules, '  '))
      .join('\n\n');
    parts.push(`/* ============ Desktop (1024px+) ============ */\n@media (min-width: 1024px) {\n${inner}\n}`);
  }

  return parts.join('\n\n');
}

function wrapHtml(html: string, css: string, js: string = ''): string {
  const scriptTag = js ? `\n<script>\n${js}\n</script>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="meeEL — mee Innovations">
<title>Made with meeEL</title>
<style>
${css}
</style>
</head>
<body>
${html}${scriptTag}
</body>
</html>`;
}

function wrapHtmlExternal(html: string, cssFilename: string, jsFilename: string = 'script.js'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="meeEL — mee Innovations">
<title>Made with meeEL</title>
<link rel="stylesheet" href="${cssFilename}">
</head>
<body>
${html}
<script src="${jsFilename}" defer></script>
</body>
</html>`;
}

/* ============ generateBlock — single block HTML/CSS ============ */

function generateBlock(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const def = resolveBlock(block.name) || { tag: 'div' };
  // Unknown block names fall back to <div> — meeEL allows free-form naming.

  const id = block.name;

  // ============ SPECIAL: LOOP ============
  const loopMatch = id.match(/^loop-(\d+)$/);
  if (loopMatch) {
    const times = parseInt(loopMatch[1], 10);
    if (times > 0 && times <= 100) {
      const outputs: string[] = [];
      for (let i = 0; i < times; i++) {
        for (const child of block.children) {
          if (child.kind === 'block') {
            const cloned = cloneBlockWithSuffix(child, String(i + 1));
            outputs.push(generateBlock(cloned, cssRules, indent));
          }
        }
      }
      return outputs.join('\n');
    }
    return '';
  }

  // ============ SPECIAL: VAR (hidden variable) ============
  const varMatch = id.match(/^keep-([a-z][a-z0-9-]*)$/);
  if (varMatch) {
    const varName = varMatch[1];
    let initialValue = '';
    for (const child of block.children) {
      if (child.kind === 'property' && child.name === 'content') {
        initialValue = child.value;
        break;
      }
    }
    return `${indent}<span id="${varName}" style="display:none">${escapeHtml(initialValue)}</span>`;
  }

  // ============ SPECIAL: SIDEBAR ============
  if (isKind(id, 'sidebar')) {
    return renderSidebar(block, cssRules, indent);
  }

  // ============ SPECIAL: CHARTS ============
  if (isKind(id, 'bar-chart')) {
    return renderBarChart(block, cssRules, indent);
  }
  if (isKind(id, 'line-chart')) {
    return renderLineChart(block, cssRules, indent);
  }
  if (isKind(id, 'donut-chart')) {
    return renderDonutChart(block, cssRules, indent);
  }

  // ============ SPECIAL: MODAL ============
  if (isKind(id, 'modal')) {
    return renderModal(block, cssRules, indent);
  }

  // ============ SPECIAL: ACCORDION ============
  if (isKind(id, 'accordion')) {
    return renderAccordion(block, cssRules, indent);
  }

  // ============ SPECIAL: BADGE ============
  if (isKind(id, 'badge')) {
    return renderBadge(block, cssRules, indent);
  }

  // ============ SPECIAL: TOOLTIP ============
  if (isKind(id, 'tooltip')) {
    return renderTooltip(block, cssRules, indent);
  }

  // ============ SPECIAL: TABS ============
  if (isKind(id, 'tabs')) {
    return renderTabs(block, cssRules, indent);
  }

  // ============ SPECIAL: TABLE ============
  if (isKind(id, 'table')) {
    return renderTable(block, cssRules, indent);
  }

  // ============ SPECIAL: TOGGLE ============
  if (isKind(id, 'toggle')) {
    return renderToggle(block, cssRules, indent);
  }

  // ============ SPECIAL: SLIDER ============
  if (isKind(id, 'slider')) {
    return renderSlider(block, cssRules, indent);
  }

  // ============ SPECIAL: RADIO GROUP ============
  if (id === 'radio-group' || id.endsWith('-radio-group') || isKind(id, 'radio-group')) {
    return renderRadioGroup(block, cssRules, indent);
  }

  // ============ SPECIAL: VIDEO ============
  // Only exact 'video' or names ENDING with '-video'
  if (id === 'video' || id.endsWith('-video')) {
    return renderVideo(block, cssRules, indent);
  }

  // ============ SPECIAL: COLOR BAR ============
  if (id === 'color-bar' || id.endsWith('-color-bar') || isKind(id, 'color-bar')) {
    // Only the full color-bar, not mini
    if (!id.includes('mini')) {
      return renderColorBar(block, cssRules, indent, false);
    }
  }

  // ============ SPECIAL: MINI COLOR BAR ============
  if (id === 'mini-color-bar' || id.endsWith('-mini-color-bar') || id.includes('mini-color-bar')) {
    return renderColorBar(block, cssRules, indent, true);
  }

  // ============ SPECIAL: CUSTOM SELECT ============
  if (id === 'custom-select' || id.endsWith('-custom-select') || isKind(id, 'custom-select')) {
    return renderCustomSelect(block, cssRules, indent);
  }

  // ============ SPECIAL: SELECT ============
  if (isKind(id, 'select')) {
    return renderSelect(block, cssRules, indent);
  }

  // ============ SPECIAL: CHECKBOX ============
  if (isKind(id, 'checkbox')) {
    return renderCheckbox(block, cssRules, indent);
  }

  // ============ SPECIAL: RADIO ============
  if (isKind(id, 'radio')) {
    return renderRadio(block, cssRules, indent, '');
  }

  // ============ SPECIAL: PROGRESS BAR ============
  if (isKind(id, 'progress-bar') || id.endsWith('-progress')) {
    return renderProgressBar(block, cssRules, indent);
  }
  // =========================================

  const css: Record<string, string> = {};
  const attrs: Record<string, string> = {};
  const textParts: string[] = [];
  const childLines: string[] = [];

  if (isKind(id, 'page')) {
    css['width'] = '100%';
    css['min-height'] = '100vh';
    css['position'] = 'relative';
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
  }

  if (isKind(id, 'nav-bar')) {
    css['width'] = '100%';
    css['min-height'] = '56px';
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'space-between';
    css['padding'] = '0 16px';
  }

  if (isKind(id, 'row')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'row';
    css['align-items'] = 'center';
    css['width'] = '100%';
  }

  if (isKind(id, 'column')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
    css['width'] = '100%';
  }

  if (isKind(id, 'card')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
  }

  if (isKind(id, 'divider')) {
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'center';
    css['width'] = '100%';
    css['gap'] = '12px';
    css['color'] = '#888';
    css['font-size'] = '13px';
  }

  if (isKind(id, 'input-bar') || isKind(id, 'input-field') || isKind(id, 'field')) {
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['width'] = '100%';
  }

  if (isKind(id, 'profile-row') || isKind(id, 'profile')) {
    css['display'] = 'flex';
    css['flex-direction'] = 'row';
    css['align-items'] = 'center';
    css['gap'] = '16px';
  }

  if (id.endsWith('-box') || id.endsWith('-info') || id === 'box' || id === 'info') {
    css['display'] = 'flex';
    css['flex-direction'] = 'column';
    css['justify-content'] = 'center';
    if (!css['gap']) css['gap'] = '4px';
  }

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(css, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;

      // Timer: every-N-second(s)/minute(s)/hour(s)
      const timerMatch = child.name.match(/^every-(\d+)-(millisecond|milliseconds|second|seconds|minute|minutes|hour|hours)$/);
      if (timerMatch) {
        const n = parseInt(timerMatch[1], 10);
        const unit = timerMatch[2];
        let msPerUnit = 1000;
        if (unit.startsWith('millisecond')) msPerUnit = 1;
        else if (unit.startsWith('minute')) msPerUnit = 60000;
        else if (unit.startsWith('hour')) msPerUnit = 3600000;
        const period = n * msPerUnit;
        const acts = child.value.split(/[\n;]/).map((s) => s.trim()).filter(Boolean);
        if (acts.length > 0) {
          collectedTimers.push({ period, actions: acts });
        }
        continue;
      }

      const propDef = PROPERTIES[child.name];
      if (!propDef) {
        throw new Error(`Unknown property '${child.name}' at line ${child.line}`);
      }

      let val = propDef.transform ? propDef.transform(child.value) : child.value;

      if (propDef.special === 'src' && ICONS[val]) {
        val = ICONS[val];
      }

      if (propDef.special === 'content-position') {
        // Value like: 'center-of-bar', 'top-of-page', 'center', 'middle'
        let pos = val.trim().toLowerCase();
        const ofMatch = pos.match(/^([a-z]+)-of-[a-z][a-z0-9-]*$/);
        if (ofMatch) pos = ofMatch[1];
        switch (pos) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
          case 'middle': hasMiddle = true; break;
          case 'center-middle': hasCenter = true; hasMiddle = true; break;
        }
      }
      else if (propDef.special === 'content') textParts.push(val);
      else if (propDef.special === 'src') attrs['src'] = val;
      else if (propDef.special === 'type') attrs['type'] = val;
      else if (propDef.special === 'placeholder') attrs['placeholder'] = val;
      else if (propDef.special === 'href') attrs['href'] = val;
      else if (propDef.special === 'on-click') {
        const actions = val.split(/[\n;]/).map((s) => s.trim()).filter(Boolean);
        if (actions.length > 0) {
          collectedHandlers.push({ elementId: id, actions });
        }
      }
      else if (propDef.special === 'open') {
        // If external URL, use directly. Otherwise treat as page name.
        if (/^https?:\/\//i.test(val) || val.startsWith('//') || val.startsWith('mailto:')) {
          attrs['data-meeel-target'] = val;
        } else {
          const targetFilename = pageToFilename(val);
          attrs['data-meeel-target'] = targetFilename;
        }
      }
      else if (propDef.special === 'value') attrs['value'] = val;
      else css[propDef.css] = val;
    }
  }

  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    css['position'] = 'absolute';
    if (hasTop) css['top'] = '0';
    if (hasBottom) css['bottom'] = '0';
    if (hasMiddle) { css['top'] = '50%'; transformY = true; }
    if (hasLeft) css['left'] = '0';
    if (hasRight) css['right'] = '0';
    if (hasCenter) { css['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      css['align-self'] = 'center';
      css['text-align'] = 'center';
      if (!css['margin-left']) css['margin-left'] = 'auto';
      if (!css['margin-right']) css['margin-right'] = 'auto';
    }
    if (hasLeft) {
      css['align-self'] = 'flex-start';
      css['text-align'] = 'left';
    }
    if (hasRight) {
      css['align-self'] = 'flex-end';
      css['text-align'] = 'right';
      css['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) css['transform'] = 'translate(-50%, -50%)';
  else if (transformX) css['transform'] = 'translateX(-50%)';
  else if (transformY) css['transform'] = 'translateY(-50%)';

  // Nested children — skip mode blocks
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (getModeKind(child.name)) continue;
      childLines.push(generateBlock(child, cssRules, indent + '  '));
    }
  }

  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) {
      pname = sub.name;
    } else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name;
      gap = sub.value;
    }
    if (!pname) continue;

    const parsed = parseParametric(pname);
    if (!parsed) continue;

    if (parsed.relation === 'below') css['margin-top'] = gap;
    else if (parsed.relation === 'above') css['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') css['margin-left'] = gap;
    else if (parsed.relation === 'left-of') css['margin-right'] = gap;
  }

  const hasInputType = block.children.some(
    (c) => c.kind === 'property' && c.name === 'input-type'
  );
  const hasBlockChildren = block.children.some(
    (c) => c.kind === 'block' && !getModeKind(c.name)
  );
  let finalTag = def.tag;

  if (hasInputType && !hasBlockChildren) {
    finalTag = 'input';
  }

  if (finalTag === 'button') {
    css['display'] = 'inline-flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'center';
    css['gap'] = '8px';
    css['cursor'] = 'pointer';
    css['border'] = css['border'] || 'none';
    css['text-align'] = 'center';
    css['font-family'] = 'inherit';
    css['font-weight'] = '500';
    css['letter-spacing'] = '0.3px';
    css['transition'] = 'all 0.2s ease';
  }

  if (finalTag === 'input') {
    css['border'] = css['border'] || 'none';
    css['outline'] = 'none';
    css['font-family'] = 'inherit';
    if (!css['width']) css['width'] = '100%';
  }

  if (id.endsWith('-icon') || id === 'icon') {
    css['display'] = 'block';
    if (!css['width']) css['width'] = '24px';
    if (!css['height']) css['height'] = '24px';
    css['object-fit'] = 'contain';
  }

  if (isKind(id, 'avatar') || isKind(id, 'logo')) {
    css['object-fit'] = 'cover';
    css['display'] = 'block';
    if (!attrs['src'] || attrs['src'] === 'avatar' || attrs['src'] === 'logo') {
      const bg = '#8b5a44';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/><circle cx="50" cy="38" r="18" fill="white" opacity="0.85"/><path d="M50 62 c-18 0 -30 12 -30 26 h60 c0 -14 -12 -26 -30 -26 z" fill="white" opacity="0.85"/></svg>`;
      attrs['src'] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
  }

  if (id === 'toggle' || id.startsWith('toggle-')) {
    attrs['type'] = 'checkbox';
  }

  // Convert data-meeel-target to actual behavior
  if (attrs['data-meeel-target']) {
    const target = attrs['data-meeel-target'];
    if (finalTag === 'a') {
      attrs['href'] = target;
    } else {
      attrs['onclick'] = `window.location.href='${target}'`;
      attrs['role'] = 'link';
      if (!css['cursor']) css['cursor'] = 'pointer';
    }
  }

  cssRules[id] = css;

  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(' ');
  const attrPart = attrStr ? ' ' + attrStr : '';

  if (VOID_TAGS.has(finalTag)) {
    return `${indent}<${finalTag} id="${id}"${attrPart}>`;
  }

  const text = textParts.map(escapeHtml).join('');
  const innerParts: string[] = [];

  if (isKind(id, 'divider') && text) {
    return `${indent}<${finalTag} id="${id}"${attrPart}>
${indent}  <span class="meeel-divider-line"></span>
${indent}  <span>${text}</span>
${indent}  <span class="meeel-divider-line"></span>
${indent}</${finalTag}>`;
  }

  if (text) innerParts.push(text);
  if (childLines.length > 0) innerParts.push(childLines.join('\n'));

  if (innerParts.length === 0) {
    return `${indent}<${finalTag} id="${id}"${attrPart}></${finalTag}>`;
  }

  return `${indent}<${finalTag} id="${id}"${attrPart}>
${innerParts.join('\n')}
${indent}</${finalTag}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============ VIDEO RENDERER ============ */

function extractYouTubeId(url: string): string | null {
  // Handles:
  //   https://www.youtube.com/watch?v=ABC123
  //   https://youtu.be/ABC123
  //   https://youtube.com/embed/ABC123
  //   https://www.youtube.com/shorts/ABC123
  const m1 = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (m2) return m2[1];
  const m3 = url.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
  if (m3) return m3[1];
  const m4 = url.match(/\/shorts\/([A-Za-z0-9_-]{6,})/);
  if (m4) return m4[1];
  return null;
}

function renderVideo(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};

  let srcUrl = '';
  let youtubeUrl = '';
  let radius = '';
  let shadow = '';
  let autoplay = false;
  let loop = false;
  let muted = false;
  let controls = true;

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (kw === 'autoplay') autoplay = true;
      else if (kw === 'loop') loop = true;
      else if (kw === 'muted') muted = true;
      else if (kw === 'no-controls') controls = false;

      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;

      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'src') { srcUrl = child.value; continue; }
      if (propDef.special === 'youtube-url') { youtubeUrl = child.value; continue; }

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'border-radius') { radius = val; continue; }
      if (propDef.css === 'box-shadow') { shadow = val; continue; }
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  if (radius) wrapperCss['--video-radius'] = radius;
  if (shadow) wrapperCss['--video-shadow'] = shadow;
  cssRules[id] = wrapperCss;

  // YouTube embed
  if (youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return `${indent}<div id="${id}" class="meeel-video" style="padding: 40px; color: #fff; text-align: center;">
${indent}  Could not read YouTube link
${indent}</div>`;
    }
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (loop) { params.set('loop', '1'); params.set('playlist', videoId); }
    if (muted) params.set('mute', '1');
    const paramStr = params.toString();
    const embedUrl = `https://www.youtube.com/embed/${videoId}${paramStr ? '?' + paramStr : ''}`;
    return `${indent}<div id="${id}" class="meeel-video">
${indent}  <iframe
${indent}    src="${escapeHtml(embedUrl)}"
${indent}    title="YouTube video"
${indent}    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
${indent}    allowfullscreen
${indent}    loading="lazy">
${indent}  </iframe>
${indent}</div>`;
  }

  // Regular video src
  if (!srcUrl) {
    return `${indent}<div id="${id}" class="meeel-video" style="padding: 40px; color: #888; text-align: center; background: #1a1a1a;">
${indent}  No video source
${indent}</div>`;
  }

  const attrs: string[] = [];
  if (controls) attrs.push('controls');
  if (autoplay) attrs.push('autoplay');
  if (loop) attrs.push('loop');
  if (muted) attrs.push('muted');
  attrs.push('playsinline');
  const attrStr = attrs.join(' ');

  return `${indent}<div id="${id}" class="meeel-video">
${indent}  <video ${attrStr}>
${indent}    <source src="${escapeHtml(srcUrl)}" type="video/mp4">
${indent}  </video>
${indent}</div>`;
}

/* ============ COLOR BAR RENDERER ============ */

const CSS_NAMED_COLORS: Record<string, string> = {
  red: '#dc2626', blue: '#2563eb', green: '#16a34a', yellow: '#eab308',
  orange: '#f97316', purple: '#9333ea', pink: '#ec4899', black: '#000000',
  white: '#ffffff', gray: '#6b7280', grey: '#6b7280', brown: '#92400e',
  cyan: '#06b6d4', magenta: '#d946ef', lime: '#84cc16', indigo: '#4f46e5',
  teal: '#14b8a6', violet: '#8b5cf6', gold: '#fbbf24', navy: '#1e3a8a',
};

function hexToHue(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 330;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  return h;
}

function hueToHex(h: number): string {
  // Convert hue to a saturated color hex
  const s = 0.9;
  const l = 0.6;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (v: number) => {
    const n = Math.round((v + m) * 255);
    return n.toString(16).padStart(2, '0');
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function renderColorBar(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string,
  mini: boolean
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};

  let titleText = mini ? '' : 'Color Selector';
  let hintText = mini ? '' : 'Click a color, or use the \u2190 \u2192 arrow keys.';
  let currentColor = mini ? '#bfbfbf' : '#ec4899';
  let bgColor = '#1a1f2e';
  let barRadius = '';
  let barPadding = '';

  // Custom colors from colors-[...] sub-block
  const customColors: Array<{ name: string; value: string }> = [];

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      if (KEYWORD_CSS[child.name]) Object.assign(wrapperCss, KEYWORD_CSS[child.name]);
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-label') { titleText = child.value; continue; }
      if (propDef.special === 'color-bar-hint') { hintText = child.value; continue; }
      if (propDef.special === 'color-bar-value') { currentColor = child.value; continue; }
      if (propDef.special === 'color-bar-radius') { barRadius = child.value; continue; }
      if (propDef.special === 'color-bar-padding') { barPadding = child.value; continue; }

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      wrapperCss[propDef.css] = val;
    } else if (child.kind === 'block') {
      if (child.name === 'colors') {
        for (const c of child.children) {
          if (c.kind === 'property') {
            const lower = c.value.toLowerCase();
            const resolved = CSS_NAMED_COLORS[lower] || c.value;
            customColors.push({ name: c.name, value: resolved });
          }
        }
      } else if (child.name === 'bar') {
        for (const c of child.children) {
          if (c.kind === 'property') {
            const v = c.value;
            if (c.name === 'radius' || c.name === 'border-radius') barRadius = v;
            if (c.name === 'padding') barPadding = v;
          }
        }
      }
    }
  }

  // Resolve current color if named
  const lower = currentColor.toLowerCase();
  if (CSS_NAMED_COLORS[lower]) {
    currentColor = CSS_NAMED_COLORS[lower];
  }

  applyPositioning(wrapperCss, {
    hasTop: false, hasBottom: false, hasMiddle: false,
    hasLeft: false, hasRight: false, hasCenter: false,
  });
  applyParametric(wrapperCss, block);
  wrapperCss['--colorbar-bg'] = bgColor;
  cssRules[id] = wrapperCss;

  const useSegments = customColors.length > 0;

  // Determine initial selected segment or hue
  let initialPct = 0;
  let selectedIdx = 0;
  if (useSegments) {
    let foundIdx = -1;
    for (let k = 0; k < customColors.length; k++) {
      if (customColors[k].value.toLowerCase() === currentColor.toLowerCase()) {
        foundIdx = k;
        break;
      }
    }
    selectedIdx = foundIdx >= 0 ? foundIdx : 0;
    currentColor = customColors[selectedIdx].value;
    const segW = 100 / customColors.length;
    initialPct = segW * selectedIdx + segW / 2;
  } else {
    const hue = hexToHue(currentColor);
    initialPct = (hue / 360) * 100;
  }

  // Build custom style overrides
  const trackStyleParts: string[] = [];
  if (barRadius) trackStyleParts.push(`border-radius: ${barRadius}`);
  if (barPadding) trackStyleParts.push(`padding: ${barPadding}`);
  const trackStyle = trackStyleParts.length > 0 ? ` style="${trackStyleParts.join('; ')}"` : '';

  const indicatorSize = mini ? 40 : 48;
  const indicatorClass = mini ? 'meeel-mini-colorbar-indicator' : 'meeel-colorbar-indicator';
  const checkClass = mini ? 'meeel-mini-colorbar-check' : 'meeel-colorbar-check';
  const checkSvg = `<svg class="${checkClass}" width="${mini ? 14 : 18}" height="${mini ? 14 : 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  if (mini) {
    let trackHtml: string;

    if (useSegments) {
      const segHtml = customColors.map((c, k) => {
        const leftPct = (k * 100) / customColors.length;
        const widthPct = 100 / customColors.length;
        const isSel = k === selectedIdx;
        const inner = isSel
          ? `<div class="meeel-colorbar-segment-check meeel-mini-colorbar-segment-check">${checkSvg}</div>`
          : '';
        return `<div class="meeel-colorbar-segment" data-idx="${k}" data-color="${c.value}" style="left:${leftPct}%;width:${widthPct}%;background:${c.value}">${inner}</div>`;
      }).join('');

      trackHtml = `${indent}  <div class="meeel-mini-colorbar-track" id="${id}-track"${trackStyle}>
${indent}    <div class="meeel-colorbar-segments">${segHtml}</div>
${indent}  </div>`;
    } else {
      trackHtml = `${indent}  <div class="meeel-mini-colorbar-track" id="${id}-track"${trackStyle}>
${indent}    <div class="meeel-mini-colorbar-indicator" id="${id}-indicator" style="left: ${initialPct.toFixed(2)}%">
${indent}      ${checkSvg}
${indent}    </div>
${indent}  </div>`;
    }

    return `${indent}<div id="${id}" class="meeel-mini-colorbar">
${trackHtml}
${indent}  <div class="meeel-mini-colorbar-info">
${indent}    <div class="meeel-mini-colorbar-swatch" id="${id}-swatch" style="background:${currentColor};box-shadow:0 0 14px 2px ${currentColor}66"></div>
${indent}    <div class="meeel-mini-colorbar-hex" id="${id}-hex">${currentColor.toUpperCase()}</div>
${indent}  </div>
${indent}</div>
${indent}<script>
(function(){
  var root = document.getElementById('${id}');
  if (!root) return;
  var swatch = document.getElementById('${id}-swatch');
  var hexEl = document.getElementById('${id}-hex');
  if (!swatch || !hexEl) return;

  function setColor(hex) {
    swatch.style.background = hex;
    swatch.style.boxShadow = '0 0 14px 2px ' + hex + '66';
    hexEl.textContent = hex.toUpperCase();
    root.setAttribute('data-value', hex);
  }

  ${useSegments ? `
  var segments = root.querySelectorAll('.meeel-colorbar-segment');
  var allChecks = root.querySelectorAll('.meeel-colorbar-segment-check');
  segments.forEach(function(seg){
    seg.addEventListener('click', function(){
      var color = seg.getAttribute('data-color');
      segments.forEach(function(s){
        var c = s.querySelector('.meeel-colorbar-segment-check');
        if (c && c.parentNode) c.parentNode.removeChild(c);
      });
      var box = document.createElement('div');
      box.className = 'meeel-colorbar-segment-check meeel-mini-colorbar-segment-check';
      box.innerHTML = '${'`'}${checkSvg.replace(/"/g, '&quot;')}${'`'}';
      seg.appendChild(box);
      setColor(color);
    });
  });
  ` : `
  var track = document.getElementById('${id}-track');
  var indicator = document.getElementById('${id}-indicator');
  if (!track || !indicator) return;
  function hueToHex(h, s, l) {
    s = s/100; l = l/100;
    var c = (1 - Math.abs(2*l - 1)) * s;
    var x = c * (1 - Math.abs(((h/60) % 2) - 1));
    var m = l - c/2;
    var r=0,g=0,b=0;
    if (h < 60) { r=c; g=x; b=0; }
    else if (h < 120) { r=x; g=c; b=0; }
    else if (h < 180) { r=0; g=c; b=x; }
    else if (h < 240) { r=0; g=x; b=c; }
    else if (h < 300) { r=x; g=0; b=c; }
    else { r=c; g=0; b=x; }
    function toHex(v){var n=Math.round((v+m)*255);return n.toString(16).padStart(2,'0');}
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }
  function updateAtPct(pct) {
    pct = Math.max(0, Math.min(100, pct));
    var hue = (pct / 100) * 360;
    var hex = hueToHex(hue, 90, 60);
    indicator.style.left = pct + '%';
    setColor(hex);
  }
  function handle(e) {
    var rect = track.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    updateAtPct((x / rect.width) * 100);
  }
  var dragging = false;
  track.addEventListener('mousedown', function(e){ dragging=true; handle(e); });
  window.addEventListener('mousemove', function(e){ if(dragging) handle(e); });
  window.addEventListener('mouseup', function(){ dragging=false; });
  track.addEventListener('touchstart', function(e){ dragging=true; handle(e); e.preventDefault(); }, {passive:false});
  track.addEventListener('touchmove', function(e){ if(dragging){ handle(e); e.preventDefault(); } }, {passive:false});
  window.addEventListener('touchend', function(){ dragging=false; });
  `}
})();
</script>`;
  }

  // Full version
  const titleHtml = titleText
    ? `${indent}  <div class="meeel-colorbar-title">${escapeHtml(titleText)}</div>`
    : '';
  const hintHtml = hintText
    ? `${indent}  <div class="meeel-colorbar-hint">${escapeHtml(hintText)}</div>`
    : '';

  let trackHtml: string;
  if (useSegments) {
    const segHtml = customColors.map((c, k) => {
      const leftPct = (k * 100) / customColors.length;
      const widthPct = 100 / customColors.length;
      const isSel = k === selectedIdx;
      const inner = isSel
        ? `<div class="meeel-colorbar-segment-check">${checkSvg}</div>`
        : '';
      return `<div class="meeel-colorbar-segment" data-idx="${k}" data-color="${c.value}" style="left:${leftPct}%;width:${widthPct}%;background:${c.value}">${inner}</div>`;
    }).join('');

    trackHtml = `${indent}  <div class="meeel-colorbar-track" id="${id}-track"${trackStyle}>
${indent}    <div class="meeel-colorbar-segments">${segHtml}</div>
${indent}  </div>`;
  } else {
    trackHtml = `${indent}  <div class="meeel-colorbar-track" id="${id}-track"${trackStyle}>
${indent}    <div class="meeel-colorbar-indicator" id="${id}-indicator" style="left: ${initialPct.toFixed(2)}%">
${indent}      ${checkSvg}
${indent}    </div>
${indent}  </div>`;
  }

  return `${indent}<div id="${id}" class="meeel-colorbar">
${titleHtml}
${hintHtml}
${trackHtml}
${indent}  <div class="meeel-colorbar-info">
${indent}    <div class="meeel-colorbar-swatch" id="${id}-swatch" style="background:${currentColor};box-shadow:0 0 18px 2px ${currentColor}80"></div>
${indent}    <div class="meeel-colorbar-meta">
${indent}      <div class="meeel-colorbar-hex" id="${id}-hex">${currentColor.toUpperCase()}</div>
${indent}      <div class="meeel-colorbar-name" id="${id}-name">${useSegments ? escapeHtml(customColors[selectedIdx].name) : 'Pink'}</div>
${indent}    </div>
${indent}    <button class="meeel-colorbar-copy" id="${id}-copy" type="button">
${indent}      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
${indent}      <span>Copy</span>
${indent}    </button>
${indent}  </div>
${indent}</div>
${indent}<script>
(function(){
  var root = document.getElementById('${id}');
  if (!root) return;
  var swatch = document.getElementById('${id}-swatch');
  var hexEl = document.getElementById('${id}-hex');
  var nameEl = document.getElementById('${id}-name');
  var copyBtn = document.getElementById('${id}-copy');
  if (!swatch || !hexEl) return;

  function setColor(hex, name) {
    swatch.style.background = hex;
    swatch.style.boxShadow = '0 0 18px 2px ' + hex + '80';
    hexEl.textContent = hex.toUpperCase();
    if (name && nameEl) nameEl.textContent = name;
    root.setAttribute('data-value', hex);
  }

  ${useSegments ? `
  var segments = root.querySelectorAll('.meeel-colorbar-segment');
  var names = ${JSON.stringify(customColors.map(c => c.name))};
  segments.forEach(function(seg){
    seg.addEventListener('click', function(){
      var color = seg.getAttribute('data-color');
      var idx = parseInt(seg.getAttribute('data-idx'), 10);
      segments.forEach(function(s){
        var c = s.querySelector('.meeel-colorbar-segment-check');
        if (c && c.parentNode) c.parentNode.removeChild(c);
      });
      var box = document.createElement('div');
      box.className = 'meeel-colorbar-segment-check';
      box.innerHTML = '${'`'}${checkSvg.replace(/"/g, '&quot;')}${'`'}';
      seg.appendChild(box);
      setColor(color, names[idx] || '');
    });
  });
  ` : `
  var track = document.getElementById('${id}-track');
  var indicator = document.getElementById('${id}-indicator');
  if (!track || !indicator) return;
  function hueToHex(h, s, l) {
    s = s/100; l = l/100;
    var c = (1 - Math.abs(2*l - 1)) * s;
    var x = c * (1 - Math.abs(((h/60) % 2) - 1));
    var m = l - c/2;
    var r=0,g=0,b=0;
    if (h < 60) { r=c; g=x; b=0; }
    else if (h < 120) { r=x; g=c; b=0; }
    else if (h < 180) { r=0; g=c; b=x; }
    else if (h < 240) { r=0; g=x; b=c; }
    else if (h < 300) { r=x; g=0; b=c; }
    else { r=c; g=0; b=x; }
    function toHex(v){var n=Math.round((v+m)*255);return n.toString(16).padStart(2,'0');}
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }
  function nameFor(hue) {
    if (hue < 15 || hue >= 345) return 'Red';
    if (hue < 45) return 'Orange';
    if (hue < 70) return 'Yellow';
    if (hue < 160) return 'Green';
    if (hue < 200) return 'Cyan';
    if (hue < 250) return 'Blue';
    if (hue < 290) return 'Purple';
    if (hue < 330) return 'Magenta';
    return 'Pink';
  }
  function updateAtPct(pct) {
    pct = Math.max(0, Math.min(100, pct));
    var hue = (pct / 100) * 360;
    var hex = hueToHex(hue, 90, 60);
    indicator.style.left = pct + '%';
    setColor(hex, nameFor(hue));
  }
  function handle(e) {
    var rect = track.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    updateAtPct((x / rect.width) * 100);
  }
  var dragging = false;
  track.addEventListener('mousedown', function(e){ dragging=true; handle(e); });
  window.addEventListener('mousemove', function(e){ if(dragging) handle(e); });
  window.addEventListener('mouseup', function(){ dragging=false; });
  track.addEventListener('touchstart', function(e){ dragging=true; handle(e); e.preventDefault(); }, {passive:false});
  track.addEventListener('touchmove', function(e){ if(dragging){ handle(e); e.preventDefault(); } }, {passive:false});
  window.addEventListener('touchend', function(){ dragging=false; });

  document.addEventListener('keydown', function(e){
    if (!root.matches(':hover') && !root.contains(document.activeElement)) return;
    var curPct = parseFloat(indicator.style.left) || 0;
    if (e.key === 'ArrowLeft') { updateAtPct(curPct - 2); e.preventDefault(); }
    if (e.key === 'ArrowRight') { updateAtPct(curPct + 2); e.preventDefault(); }
  });
  `}

  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', function(){
      var hex = hexEl.textContent || '';
      var done = function() {
        copyBtn.classList.add('copied');
        var sp = copyBtn.querySelector('span');
        var old = sp ? sp.textContent : 'Copy';
        if (sp) sp.textContent = 'Copied';
        setTimeout(function(){ copyBtn.classList.remove('copied'); if (sp) sp.textContent = old; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hex).then(done).catch(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = hex;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(e){}
        document.body.removeChild(ta);
        done();
      }
    });
  }
})();
</script>`;
}

/* ============ SIDEBAR RENDERER ============ */

function renderSidebar(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let bgColor = '#1a1a1a';
  let color = '#b0b0b0';
  let width = '240px';
  let radius = '12px';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      if (propDef.css === 'color') { color = val; continue; }
      if (propDef.css === 'width') { width = val; continue; }
      if (propDef.css === 'border-radius') { radius = val; continue; }
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--sidebar-bg'] = bgColor;
  wrapperCss['--sidebar-color'] = color;
  wrapperCss['--sidebar-width'] = width;
  wrapperCss['--sidebar-radius'] = radius;
  cssRules[id] = wrapperCss;

  const items = block.children.filter(
    (c) => c.kind === 'block' && isKind(c.name, 'sidebar-item')
  ) as BlockNode[];

  const itemsHtml = items
    .map((item) => {
      let iconUrl = '';
      let labelText = '';
      let openTarget = '';
      let isSelected = false;

      for (const c of item.children) {
        if (c.kind === 'keyword' && c.name === 'selected') {
          isSelected = true;
        } else if (c.kind === 'property') {
          const propDef = PROPERTIES[c.name];
          if (!propDef) continue;
          if (propDef.special === 'src') {
            iconUrl = ICONS[c.value] || c.value;
          } else if (propDef.special === 'toggle-label') {
            labelText = c.value;
          } else if (propDef.special === 'open') {
            openTarget = pageToFilename(c.value);
          }
        } else if (c.kind === 'block' && (c.name === 'icon' || c.name.startsWith('icon-'))) {
          // Support natural `icon-[home]` syntax — first keyword becomes icon name
          for (const sub of c.children) {
            if (sub.kind === 'keyword') {
              iconUrl = ICONS[sub.name] || sub.name;
              break;
            } else if (sub.kind === 'property' && sub.name === 'url') {
              iconUrl = ICONS[sub.value] || sub.value;
              break;
            }
          }
        }
      }

      const cls = 'meeel-sidebar-item' + (isSelected ? ' selected' : '');
      const hrefAttr = openTarget ? ` href="${escapeHtml(openTarget)}"` : '';
      const dataAttr = openTarget ? ` data-meeel-target="${escapeHtml(openTarget)}"` : '';

      const iconHtml = iconUrl
        ? `<img class="meeel-sidebar-item-icon" src="${escapeHtml(iconUrl)}" alt="">`
        : '';

      return `${indent}  <a id="${item.name}" class="${cls}"${hrefAttr}${dataAttr}>
${indent}    ${iconHtml}<span class="meeel-sidebar-item-label">${escapeHtml(labelText)}</span>
${indent}  </a>`;
    })
    .join('\n');

  return `${indent}<nav id="${id}" class="meeel-sidebar">
${itemsHtml}
${indent}</nav>`;
}

/* ============ CHART HELPERS ============ */

interface ChartSetup {
  wrapperCss: Record<string, string>;
  data: number[];
  labels: string[];
  color: string;
  height: number;
  bgColor: string;
  borderColor: string;
  radius: string;
  labelColor: string;
}

function parseChartSetup(block: BlockNode): ChartSetup {
  const wrapperCss: Record<string, string> = {};
  let dataStr = '';
  let labelsStr = '';
  let color = '#0a84ff';
  let height = 200;
  let bgColor = '#ffffff';
  let borderColor = '#e5e5e5';
  let radius = '12px';
  let labelColor = '#888888';

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (KEYWORD_CSS[kw]) Object.assign(wrapperCss, KEYWORD_CSS[kw]);
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'chart-data') { dataStr = child.value; continue; }
      if (propDef.special === 'chart-labels') { labelsStr = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'color') { color = val; continue; }
      if (propDef.css === 'height') { height = parseFloat(val) || 200; continue; }
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      if (propDef.css === 'border') { borderColor = val; continue; }
      if (propDef.css === 'border-radius') { radius = val; continue; }
      if (propDef.css === 'font-size') { wrapperCss['--chart-label-color'] = val; continue; }
      wrapperCss[propDef.css] = val;
    }
  }

  const data = dataStr
    .split(/\s+/)
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n));

  const labels = labelsStr ? labelsStr.split(/\s+/) : [];

  return { wrapperCss, data, labels, color, height, bgColor, borderColor, radius, labelColor };
}

function applyChartPositioning(
  wrapperCss: Record<string, string>,
  block: BlockNode
): void {
  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      }
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);
}

function labelsRow(labels: string[], indent: string): string {
  if (labels.length === 0) return '';
  const spans = labels.map((l) => `<span>${escapeHtml(l)}</span>`).join('');
  return `${indent}  <div class="meeel-chart-labels">${spans}</div>`;
}

/* ============ BAR CHART ============ */

function renderBarChart(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const setup = parseChartSetup(block);
  applyChartPositioning(setup.wrapperCss, block);

  setup.wrapperCss['--chart-bg'] = setup.bgColor;
  setup.wrapperCss['--chart-border'] = setup.borderColor;
  setup.wrapperCss['--chart-radius'] = setup.radius;
  setup.wrapperCss['--chart-color'] = setup.color;
  cssRules[id] = setup.wrapperCss;

  const data = setup.data.length > 0 ? setup.data : [10, 25, 40, 30, 55, 70, 45];
  const max = Math.max(...data, 1);
  const H = 200;
  const W = 100;
  const n = data.length;
  // Gap proportional to available space (small fixed gap in 100-unit viewBox)
  const gap = n > 1 ? Math.min(3, W / (n * 4)) : 0;
  const barW = Math.max(1, (W - gap * (n - 1)) / n);

  const bars = data
    .map((v, i) => {
      const h = (v / max) * (H - 10);
      const x = i * (barW + gap);
      const y = H - h;
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" rx="3" fill="${setup.color}"/>`;
    })
    .join('');

  return `${indent}<div id="${id}" class="meeel-chart">
${indent}  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height: ${setup.height}px">
${indent}    <g>${bars}</g>
${indent}  </svg>
${labelsRow(setup.labels, indent)}
${indent}</div>`;
}

/* ============ LINE CHART ============ */

function renderLineChart(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const setup = parseChartSetup(block);
  applyChartPositioning(setup.wrapperCss, block);

  setup.wrapperCss['--chart-bg'] = setup.bgColor;
  setup.wrapperCss['--chart-border'] = setup.borderColor;
  setup.wrapperCss['--chart-radius'] = setup.radius;
  cssRules[id] = setup.wrapperCss;

  const data = setup.data.length > 1 ? setup.data : [10, 20, 15, 30, 45, 35, 60];
  const max = Math.max(...data, 1);
  const H = 100;
  const W = 100;
  const n = data.length;
  const stepX = n > 1 ? W / (n - 1) : W;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = H - (v / max) * (H - 4) - 2;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  // Area fill path
  const areaD = `${pathD} L ${W} ${H} L 0 ${H} Z`;

  const dots = points
    .map((p) => `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="1.5" fill="${setup.color}"/>`)
    .join('');

  return `${indent}<div id="${id}" class="meeel-chart">
${indent}  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height: ${setup.height}px">
${indent}    <defs>
${indent}      <linearGradient id="${id}-grad" x1="0" y1="0" x2="0" y2="1">
${indent}        <stop offset="0%" stop-color="${setup.color}" stop-opacity="0.35"/>
${indent}        <stop offset="100%" stop-color="${setup.color}" stop-opacity="0"/>
${indent}      </linearGradient>
${indent}    </defs>
${indent}    <path d="${areaD}" fill="url(#${id}-grad)"/>
${indent}    <path d="${pathD}" fill="none" stroke="${setup.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
${indent}    ${dots}
${indent}  </svg>
${labelsRow(setup.labels, indent)}
${indent}</div>`;
}

/* ============ DONUT CHART ============ */

function renderDonutChart(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const setup = parseChartSetup(block);
  applyChartPositioning(setup.wrapperCss, block);

  // Extract value + label
  let value = 75;
  let labelText = '';
  let maxValue = 100;

  for (const child of block.children) {
    if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special === 'chart-value') {
        const v = parseFloat(child.value);
        if (!isNaN(v)) value = v;
      }
      if (propDef.special === 'chart-max') {
        const m = parseFloat(child.value);
        if (!isNaN(m)) maxValue = m;
      }
      if (propDef.special === 'toggle-label') labelText = child.value;
    }
  }

  if (setup.data.length > 0) value = setup.data[0];

  setup.wrapperCss['--chart-bg'] = setup.bgColor;
  setup.wrapperCss['--chart-border'] = setup.borderColor;
  setup.wrapperCss['--chart-radius'] = setup.radius;
  setup.wrapperCss['--chart-color'] = '#1a1a1a';
  cssRules[id] = setup.wrapperCss;

  const R = 42;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(1, value / maxValue));
  const dash = C * pct;
  const rest = C - dash;

  const cx = 60;
  const cy = 60;

  const labelHtml = labelText
    ? `${indent}    <div class="meeel-chart-donut-text">${escapeHtml(labelText)}</div>`
    : '';

  return `${indent}<div id="${id}" class="meeel-chart">
${indent}  <div class="meeel-chart-donut-wrap">
${indent}    <svg viewBox="0 0 120 120" style="width: 100%; height: 100%;">
${indent}      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${setup.color}" stroke-opacity="0.15" stroke-width="12"/>
${indent}      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${setup.color}" stroke-width="12"
${indent}        stroke-dasharray="${dash.toFixed(2)} ${rest.toFixed(2)}"
${indent}        stroke-linecap="round"
${indent}        transform="rotate(-90 ${cx} ${cy})"/>
${indent}    </svg>
${indent}    <div class="meeel-chart-donut-label">
${indent}      <div class="meeel-chart-donut-value">${value}</div>
${labelHtml}
${indent}    </div>
${indent}  </div>
${indent}</div>`;
}

/* ============ MODAL RENDERER ============ */

function renderModal(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let triggerText = 'Open';
  let titleText = '';
  let closeText = 'Close';
  let contentText = '';
  let triggerBg = '#0a84ff';
  let triggerColor = '#ffffff';
  let modalBg = '#ffffff';
  let modalColor = '#1a1a1a';
  let modalRadius = '14px';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'modal-trigger') { triggerText = child.value; continue; }
      if (propDef.special === 'modal-title') { titleText = child.value; continue; }
      if (propDef.special === 'modal-close') { closeText = child.value; continue; }
      if (propDef.special === 'content') { contentText = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { triggerBg = val; continue; }
      if (propDef.css === 'color') { triggerColor = val; continue; }
      if (propDef.css === 'border-radius') { modalRadius = val; continue; }
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--modal-trigger-bg'] = triggerBg;
  wrapperCss['--modal-trigger-color'] = triggerColor;
  wrapperCss['--modal-bg'] = modalBg;
  wrapperCss['--modal-color'] = modalColor;
  wrapperCss['--modal-radius'] = modalRadius;
  cssRules[id] = wrapperCss;

  const titleHtml = titleText
    ? `\n${indent}        <div class="meeel-modal-title">${escapeHtml(titleText)}</div>`
    : '';

  const bodyHtml = contentText
    ? `${indent}        <div class="meeel-modal-body">${escapeHtml(contentText)}</div>`
    : '';

  // Any nested blocks go inside the modal body
  const nestedBlocks: string[] = [];
  for (const c of block.children) {
    if (c.kind === 'block') {
      nestedBlocks.push(generateBlock(c, cssRules, indent + '        '));
    }
  }

  const innerBody = nestedBlocks.length > 0
    ? `${indent}        ${nestedBlocks.join('\n' + indent + '        ')}`
    : '';

  return `${indent}<div id="${id}" class="meeel-modal">
${indent}  <input type="checkbox" id="${id}-state">
${indent}  <label for="${id}-state" class="meeel-modal-trigger">${escapeHtml(triggerText)}</label>
${indent}  <div class="meeel-modal-overlay">
${indent}    <div class="meeel-modal-content">
${indent}      <label for="${id}-state" class="meeel-modal-x" aria-label="Close">
${indent}        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
${indent}      </label>${titleHtml}
${indent}      ${bodyHtml}
${indent}      ${innerBody}
${indent}      <label for="${id}-state" class="meeel-modal-close">${escapeHtml(closeText)}</label>
${indent}    </div>
${indent}  </div>
${indent}</div>`;
}

/* ============ ACCORDION RENDERER ============ */

function renderAccordion(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let bgColor = '#ffffff';
  let borderColor = '#e5e5e5';
  let textColor = '#1a1a1a';
  let radius = '12px';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      if (propDef.css === 'color') { textColor = val; continue; }
      if (propDef.css === 'border') { borderColor = val; continue; }
      if (propDef.css === 'border-radius') { radius = val; continue; }
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--accordion-bg'] = bgColor;
  wrapperCss['--accordion-border'] = borderColor;
  wrapperCss['--accordion-color'] = textColor;
  wrapperCss['--accordion-radius'] = radius;
  cssRules[id] = wrapperCss;

  const items = block.children.filter(
    (c) => c.kind === 'block' && isKind(c.name, 'accordion-item')
  ) as BlockNode[];

  const itemsHtml = items
    .map((item, i) => {
      let titleText = '';
      let bodyText = '';
      const nestedBody: string[] = [];

      for (const c of item.children) {
        if (c.kind === 'property' && c.name === 'label-text') titleText = c.value;
        else if (c.kind === 'property' && c.name === 'content') bodyText = c.value;
        else if (c.kind === 'block') nestedBody.push(generateBlock(c, cssRules, indent + '          '));
      }

      const isOpen = item.children.some(
        (c) => c.kind === 'keyword' && c.name === 'selected'
      );

      const checkedAttr = isOpen ? ' checked' : '';
      const inputId = `${id}-item-${i}`;

      const bodyInner = bodyText
        ? `${indent}        ${escapeHtml(bodyText)}`
        : nestedBody.join('\n');

      return `${indent}  <div class="meeel-accordion-item">
${indent}    <input type="checkbox" id="${inputId}"${checkedAttr}>
${indent}    <label for="${inputId}" class="meeel-accordion-header">
${indent}      <span>${escapeHtml(titleText)}</span>
${indent}      <svg class="meeel-accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
${indent}    </label>
${indent}    <div class="meeel-accordion-content">
${indent}      <div class="meeel-accordion-body">
${bodyInner}
${indent}      </div>
${indent}    </div>
${indent}  </div>`;
    })
    .join('\n');

  return `${indent}<div id="${id}" class="meeel-accordion">
${itemsHtml}
${indent}</div>`;
}

/* ============ BADGE RENDERER ============ */

function renderBadge(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let text = '';
  let badgeColor = '#ffffff';
  let badgeBg = '#0a84ff';

  for (const child of block.children) {
    if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special === 'content') text = child.value;
      else if (propDef.special === 'badge-color') badgeColor = child.value;
      else if (propDef.special === 'badge-bg') badgeBg = child.value;
      else {
        const val = propDef.transform ? propDef.transform(child.value) : child.value;
        wrapperCss[propDef.css] = val;
      }
    }
  }

  wrapperCss['--badge-color'] = badgeColor;
  wrapperCss['--badge-bg'] = badgeBg;
  cssRules[id] = wrapperCss;

  return `${indent}<span id="${id}" class="meeel-badge">${escapeHtml(text)}</span>`;
}

/* ============ TOOLTIP RENDERER ============ */

function renderTooltip(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let triggerText = '';
  let tooltipText = '';
  let tooltipBg = '#1a1a1a';
  let tooltipColor = '#ffffff';

  for (const child of block.children) {
    if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special === 'content') triggerText = child.value;
      else if (propDef.special === 'placeholder') tooltipText = child.value;
      else if (propDef.special === 'badge-bg') tooltipBg = child.value;
      else if (propDef.special === 'badge-color') tooltipColor = child.value;
      else {
        const val = propDef.transform ? propDef.transform(child.value) : child.value;
        wrapperCss[propDef.css] = val;
      }
    }
  }

  wrapperCss['--tooltip-bg'] = tooltipBg;
  wrapperCss['--tooltip-color'] = tooltipColor;
  cssRules[id] = wrapperCss;

  return `${indent}<span id="${id}" class="meeel-tooltip">
${indent}  <span class="meeel-tooltip-trigger">${escapeHtml(triggerText)}</span>
${indent}  <span class="meeel-tooltip-text">${escapeHtml(tooltipText)}</span>
${indent}</span>`;
}

/* ============ TABS RENDERER ============ */

function renderTabs(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let bgColor = '#ffffff';
  let borderColor = '#e5e5e5';
  let headerBg = '#f7f7f7';
  let labelColor = '#666666';
  let textColor = '#1a1a1a';
  let activeColor = '#0a84ff';
  let radius = '12px';
  let padding = '20px';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      if (propDef.css === 'color') { textColor = val; continue; }
      if (propDef.css === 'border') { borderColor = val; continue; }
      if (propDef.css === 'border-radius') { radius = val; continue; }
      if (propDef.css === 'padding') { padding = val; continue; }
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--tabs-bg'] = bgColor;
  wrapperCss['--tabs-border'] = borderColor;
  wrapperCss['--tabs-header-bg'] = headerBg;
  wrapperCss['--tabs-label-color'] = labelColor;
  wrapperCss['--tabs-color'] = textColor;
  wrapperCss['--tabs-active-color'] = activeColor;
  wrapperCss['--tabs-radius'] = radius;
  wrapperCss['--tabs-padding'] = padding;
  cssRules[id] = wrapperCss;

  // Extract tab children
  const tabBlocks = block.children.filter(
    (c) => c.kind === 'block' && isKind(c.name, 'tab')
  ) as BlockNode[];

  if (tabBlocks.length === 0) {
    return `${indent}<div id="${id}" class="meeel-tabs"></div>`;
  }

  // Determine selected
  let selectedIdx = tabBlocks.findIndex((t) =>
    t.children.some((c) => c.kind === 'keyword' && c.name === 'selected')
  );
  if (selectedIdx === -1) selectedIdx = 0;

  // Build inputs
  const inputsHtml = tabBlocks
    .map((_, i) => {
      const checkedAttr = i === selectedIdx ? ' checked' : '';
      return `${indent}  <input type="radio" name="${id}-group" id="${id}-input-${i}"${checkedAttr}>`;
    })
    .join('\n');

  // Build labels
  const labelsHtml = tabBlocks
    .map((tabBlock, i) => {
      let labelText = '';
      for (const child of tabBlock.children) {
        if (child.kind === 'property' && child.name === 'label-text') {
          labelText = child.value;
          break;
        }
      }
      if (!labelText) labelText = `Tab ${i + 1}`;
      return `${indent}    <label for="${id}-input-${i}">${escapeHtml(labelText)}</label>`;
    })
    .join('\n');

  // Build panels
  const panelsHtml = tabBlocks
    .map((tabBlock, i) => {
      let contentText = '';
      const nested: string[] = [];

      for (const child of tabBlock.children) {
        if (child.kind === 'property' && child.name === 'content') {
          contentText = child.value;
        } else if (child.kind === 'block') {
          nested.push(generateBlock(child, cssRules, indent + '      '));
        }
      }

      const inner = contentText
        ? `${indent}    ${escapeHtml(contentText)}`
        : nested.join('\n');

      return `${indent}  <div class="meeel-tab-panel" data-idx="${i}">
${inner}
${indent}  </div>`;
    })
    .join('\n');

  // Build scoped CSS for checked behavior
  const scopeCss = tabBlocks
    .map((_, i) => {
      return `#${id}-input-${i}:checked ~ .meeel-tab-headers label[for="${id}-input-${i}"] { color: var(--tabs-active-color, #0a84ff); border-bottom-color: var(--tabs-active-color, #0a84ff); }\n#${id}-input-${i}:checked ~ .meeel-tab-panel[data-idx="${i}"] { display: block; }`;
    })
    .join('\n');

  return `${indent}<div id="${id}" class="meeel-tabs">
${indent}  <style>${scopeCss}</style>
${inputsHtml}
${indent}  <div class="meeel-tab-headers">
${labelsHtml}
${indent}  </div>
${panelsHtml}
${indent}</div>`;
}

/* ============ TABLE RENDERER ============ */

function renderTable(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let bgColor = '#ffffff';
  let borderColor = '#e5e5e5';
  let headerBg = '#f7f7f7';
  let headerColor = '#555555';
  let textColor = '#1a1a1a';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      if (propDef.css === 'color') { textColor = val; continue; }
      if (propDef.css === 'border') { borderColor = val; continue; }
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--table-bg'] = bgColor;
  wrapperCss['--table-border'] = borderColor;
  wrapperCss['--table-header-bg'] = headerBg;
  wrapperCss['--table-header-color'] = headerColor;
  wrapperCss['--table-color'] = textColor;
  cssRules[id] = wrapperCss;

  const headingBlock = block.children.find(
    (c) => c.kind === 'block' && (c.name === 'heading' || c.name === 'table-heading')
  ) as BlockNode | undefined;

  const dataRows = block.children.filter(
    (c) => c.kind === 'block' && (c.name === 'table-row')
  ) as BlockNode[];

  let headHtml = '';
  if (headingBlock) {
    const headCells = headingBlock.children.filter(
      (c) => c.kind === 'block' && (c.name === 'cell' || c.name === 'table-cell')
    ) as BlockNode[];

    const cellHtml = headCells
      .map((cell) => renderTableCell(cell, true, indent + '      '))
      .join('\n');

    headHtml = `${indent}  <thead>
${indent}    <tr>
${cellHtml}
${indent}    </tr>
${indent}  </thead>`;
  }

  const bodyRowsHtml = dataRows
    .map((row) => {
      const cells = row.children.filter(
        (c) => c.kind === 'block' && (c.name === 'cell' || c.name === 'table-cell')
      ) as BlockNode[];

      const cellHtml = cells
        .map((cell) => renderTableCell(cell, false, indent + '      '))
        .join('\n');

      return `${indent}    <tr>
${cellHtml}
${indent}    </tr>`;
    })
    .join('\n');

  const bodyHtml =
    dataRows.length > 0
      ? `${indent}  <tbody>
${bodyRowsHtml}
${indent}  </tbody>`
      : '';

  return `${indent}<table id="${id}" class="meeel-table">
${headHtml}
${bodyHtml}
${indent}</table>`;
}

function renderTableCell(
  block: BlockNode,
  isHeader: boolean,
  indent: string
): string {
  const tag = isHeader ? 'th' : 'td';
  let content = '';
  const cellCss: Record<string, string> = {};
  let alignRight = false;
  let alignCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      if (child.name === 'right') alignRight = true;
      else if (child.name === 'center') alignCenter = true;
      else if (KEYWORD_CSS[child.name]) Object.assign(cellCss, KEYWORD_CSS[child.name]);
    } else if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special === 'content') content = child.value;
      else if (propDef.special) continue;
      else {
        const val = propDef.transform ? propDef.transform(child.value) : child.value;
        cellCss[propDef.css] = val;
      }
    }
  }

  const classes: string[] = [];
  if (alignRight) classes.push('meeel-table-cell-right');
  if (alignCenter) classes.push('meeel-table-cell-center');

  const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
  const styleAttr = Object.keys(cellCss).length > 0
    ? ` style="${Object.entries(cellCss).map(([k, v]) => `${k}: ${v}`).join('; ')}"`
    : '';

  return `${indent}<${tag}${classAttr}${styleAttr}>${escapeHtml(content)}</${tag}>`;
}

function isDarkColor(color: string): boolean {
  if (!color) return false;
  const c = color.trim().toLowerCase();
  if (c === 'black' || c === '#000' || c === '#000000') return true;
  if (c === 'white' || c === '#fff' || c === '#ffffff') return false;
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((ch) => ch + ch).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      // Brightness formula
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }
  }
  return false;
}

/* ============ CUSTOM SELECT RENDERER ============ */

function renderCustomSelect(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let labelText = '';
  let bgColor = '#f5f5f5';
  let textColor = '#1a1a1a';
  let borderColor = '#e0e0e0';
  let focusColor = '#0a84ff';
  let radius = '8px';

  const options: Array<{ value: string; label: string; icon?: string; selected: boolean }> = [];

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      if (propDef.css === 'color') { textColor = val; continue; }
      if (propDef.css === 'border') { borderColor = val; continue; }
      if (propDef.css === 'border-radius') { radius = val; continue; }
      wrapperCss[propDef.css] = val;
    } else if (child.kind === 'block') {
      if (isKind(child.name, 'option')) {
        options.push(parseCustomOption(child));
      }
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--cselect-bg'] = bgColor;
  wrapperCss['--cselect-color'] = textColor;
  wrapperCss['--cselect-border'] = borderColor;
  wrapperCss['--cselect-focus'] = focusColor;
  wrapperCss['--cselect-radius'] = radius;

  // Menu colors: if button bg is dark, menu is dark; else menu is light.
  const isDarkBg = isDarkColor(bgColor);
  wrapperCss['--cselect-menu-bg'] = isDarkBg ? '#1e1e1e' : '#ffffff';
  wrapperCss['--cselect-menu-color'] = isDarkBg ? '#e0e0e0' : '#1a1a1a';
  wrapperCss['--cselect-menu-border'] = isDarkBg ? '#333333' : '#e0e0e0';
  wrapperCss['--cselect-option-hover'] = isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(10,132,255,0.10)';
  wrapperCss['--cselect-option-active'] = isDarkBg ? 'rgba(10,132,255,0.24)' : 'rgba(10,132,255,0.14)';

  cssRules[id] = wrapperCss;

  if (options.length === 0) {
    options.push({ value: '', label: 'Choose...', selected: true });
  }

  // Ensure exactly one option is selected
  let selectedIdx = options.findIndex((o) => o.selected);
  if (selectedIdx === -1) {
    selectedIdx = 0;
    options[0].selected = true;
  }

  const selected = options[selectedIdx];

  const optionHtml = options
    .map((o, i) => {
      const activeCls = i === selectedIdx ? ' active' : '';
      const iconHtml = o.icon
        ? `\n      <img class="meeel-cselect-option-icon" src="${escapeHtml(o.icon)}" alt="">`
        : '';
      return `${indent}      <div class="meeel-cselect-option${activeCls}" data-value="${escapeHtml(o.value)}" data-index="${i}">${iconHtml}
${indent}        <span>${escapeHtml(o.label)}</span>
${indent}        <svg class="meeel-cselect-option-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
${indent}      </div>`;
    })
    .join('\n');

  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-cselect-label">${escapeHtml(labelText)}</span>`
    : '';

  const selectedIconHtml = selected.icon
    ? `\n      <img class="meeel-cselect-option-icon" src="${escapeHtml(selected.icon)}" alt="">`
    : '';

  // JS to toggle menu + select option (no framework)
  const jsVar = `__meeel_cselect_${id.replace(/[^a-z0-9]/g, '_')}`;

  return `${indent}<div id="${id}" class="meeel-cselect" data-cselect>
${indent}  <button type="button" class="meeel-cselect-btn" onclick="(function(btn){
${indent}    var root = btn.closest('[data-cselect]');
${indent}    var wasOpen = root.classList.contains('open');
${indent}    document.querySelectorAll('[data-cselect].open').forEach(function(el){ el.classList.remove('open'); });
${indent}    if (!wasOpen) root.classList.add('open');
${indent}  })(this)">
${indent}    <span class="meeel-cselect-current">${selectedIconHtml}
${indent}      <span>${escapeHtml(selected.label)}</span>
${indent}    </span>
${indent}    <svg class="meeel-cselect-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
${indent}  </button>
${indent}  <div class="meeel-cselect-menu">
${optionHtml}
${indent}  </div>
${indent}</div>
${indent}<script>
(function(){
  var root = document.getElementById('${id}');
  if (!root) return;
  var btn = root.querySelector('.meeel-cselect-btn');
  var menu = root.querySelector('.meeel-cselect-menu');
  var currentEl = root.querySelector('.meeel-cselect-current');
  menu.addEventListener('click', function(e){
    var opt = e.target.closest('.meeel-cselect-option');
    if (!opt) return;
    var idx = parseInt(opt.getAttribute('data-index'), 10);
    var options = ${JSON.stringify(options.map(o => ({ value: o.value, label: o.label, icon: o.icon || null })))};
    var chosen = options[idx];
    if (!chosen) return;
    var iconHtml = chosen.icon
      ? '<img class="meeel-cselect-option-icon" src="' + chosen.icon + '" alt="">'
      : '';
    currentEl.innerHTML = iconHtml + '<span>' + chosen.label.replace(/</g,'&lt;') + '</span>';
    root.querySelectorAll('.meeel-cselect-option').forEach(function(el){ el.classList.remove('active'); });
    opt.classList.add('active');
    root.classList.remove('open');
    root.setAttribute('data-value', chosen.value);
  });
  document.addEventListener('click', function(e){
    if (!root.contains(e.target)) root.classList.remove('open');
  });
})();
</script>`;
}

function parseCustomOption(block: BlockNode): { value: string; label: string; icon?: string; selected: boolean } {
  let label = '';
  let value = '';
  let icon = '';
  let selected = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      if (child.name === 'selected') selected = true;
    } else if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special === 'content') label = child.value;
      else if (propDef.special === 'value') value = child.value;
      else if (propDef.special === 'src') icon = child.value;
    }
  }

  if (!label) {
    const base = block.name.replace(/^option-?/, '');
    label = base || 'Option';
  }
  if (!value) value = label;

  return { value, label, icon: icon || undefined, selected };
}

/* ============ SELECT RENDERER ============ */

function renderSelect(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let labelText = '';
  let bgColor = '#f5f5f5';
  let textColor = '#1a1a1a';
  let borderColor = '#e0e0e0';
  let focusColor = '#0a84ff';

  const options: Array<{ value: string; label: string; selected: boolean }> = [];

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      if (propDef.css === 'background-color') { bgColor = val; continue; }
      if (propDef.css === 'color') { textColor = val; continue; }
      if (propDef.css === 'border') {
        borderColor = val;
        continue;
      }
      wrapperCss[propDef.css] = val;
    } else if (child.kind === 'block') {
      if (isKind(child.name, 'option')) {
        const opt = parseOption(child);
        options.push(opt);
      } else if (child.name === 'option-group' || child.name.endsWith('-options')) {
        // Options inside a group
        for (const sub of child.children) {
          if (sub.kind === 'block' && isKind(sub.name, 'option')) {
            options.push(parseOption(sub));
          }
        }
      }
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--select-bg'] = bgColor;
  wrapperCss['--select-color'] = textColor;
  wrapperCss['--select-border'] = borderColor;
  wrapperCss['--select-focus'] = focusColor;
  cssRules[id] = wrapperCss;

  // If no options provided, add a placeholder
  if (options.length === 0) {
    options.push({ value: '', label: 'Choose...', selected: true });
  }

  const optionHtml = options
    .map((o) => {
      const sel = o.selected ? ' selected' : '';
      return `${indent}    <option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
    })
    .join('\n');

  const labelHtml = labelText
    ? `\n${indent}  <label class="meeel-select-label" for="${id}-input">${escapeHtml(labelText)}</label>`
    : '';

  return `${indent}<div id="${id}" class="meeel-select">${labelHtml}
${indent}  <select id="${id}-input" name="${id}">
${optionHtml}
${indent}  </select>
${indent}</div>`;
}

function parseOption(block: BlockNode): { value: string; label: string; selected: boolean } {
  let label = '';
  let value = '';
  let selected = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      if (child.name === 'selected') selected = true;
    } else if (child.kind === 'property') {
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;
      if (propDef.special === 'content') label = child.value;
      else if (propDef.special === 'value') value = child.value;
    }
  }

  if (!label) {
    // use block name as fallback
    const base = block.name.replace(/^option-?/, '');
    label = base || 'Option';
  }
  if (!value) value = label;

  return { value, label, selected };
}

/* ============ CHECKBOX RENDERER ============ */

function renderCheckbox(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let labelText = '';
  let checked = false;
  let checkColor = '#0a84ff';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (kw === 'checked') { checked = true; continue; }
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special === 'input-checked') { checked = child.value !== 'no'; continue; }
      if (propDef.special === 'input-check-color') { checkColor = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--check-color'] = checkColor;
  cssRules[id] = wrapperCss;

  const checkedAttr = checked ? ' checked' : '';
  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-checkbox-label">${escapeHtml(labelText)}</span>`
    : '';

  return `${indent}<label id="${id}" class="meeel-checkbox">
${indent}  <input type="checkbox"${checkedAttr}>
${indent}  <span class="meeel-checkbox-box"></span>${labelHtml}
${indent}</label>`;
}

/* ============ RADIO RENDERER ============ */

function renderRadio(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string,
  groupName: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let labelText = '';
  let checked = false;
  let checkColor = '#0a84ff';
  let ownGroupName = groupName;

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (kw === 'checked') { checked = true; continue; }
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special === 'input-checked') { checked = child.value !== 'no'; continue; }
      if (propDef.special === 'input-check-color') { checkColor = child.value; continue; }
      if (propDef.special === 'radio-group-name') { ownGroupName = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  wrapperCss['--check-color'] = checkColor;
  cssRules[id] = wrapperCss;

  const checkedAttr = checked ? ' checked' : '';
  const nameAttr = ownGroupName ? ` name="${escapeHtml(ownGroupName)}"` : '';
  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-radio-label">${escapeHtml(labelText)}</span>`
    : '';

  return `${indent}<label id="${id}" class="meeel-radio">
${indent}  <input type="radio"${nameAttr}${checkedAttr}>
${indent}  <span class="meeel-radio-circle"></span>${labelHtml}
${indent}</label>`;
}

/* ============ RADIO GROUP RENDERER ============ */

function renderRadioGroup(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let groupName = id;

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'radio-group-name') { groupName = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  applyPositioning(wrapperCss, { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter });
  applyParametric(wrapperCss, block);

  cssRules[id] = wrapperCss;

  const childLines: string[] = [];
  for (const child of block.children) {
    if (child.kind === 'block') {
      if (isKind(child.name, 'radio')) {
        childLines.push(renderRadio(child, cssRules, indent + '  ', groupName));
      } else {
        // Any other block — generate normally
        childLines.push(generateBlock(child, cssRules, indent + '  '));
      }
    }
  }

  return `${indent}<div id="${id}" class="meeel-radio-group">
${childLines.join('\n')}
${indent}</div>`;
}

/* ============ SHARED POSITIONING HELPERS ============ */

function applyPositioning(
  css: Record<string, string>,
  flags: {
    hasTop: boolean; hasBottom: boolean; hasMiddle: boolean;
    hasLeft: boolean; hasRight: boolean; hasCenter: boolean;
  }
): void {
  const { hasTop, hasBottom, hasMiddle, hasLeft, hasRight, hasCenter } = flags;
  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    css['position'] = 'absolute';
    if (hasTop) css['top'] = '0';
    if (hasBottom) css['bottom'] = '0';
    if (hasMiddle) { css['top'] = '50%'; transformY = true; }
    if (hasLeft) css['left'] = '0';
    if (hasRight) css['right'] = '0';
    if (hasCenter) { css['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      css['align-self'] = 'center';
      if (!css['margin-left']) css['margin-left'] = 'auto';
      if (!css['margin-right']) css['margin-right'] = 'auto';
    }
    if (hasLeft) css['align-self'] = 'flex-start';
    if (hasRight) {
      css['align-self'] = 'flex-end';
      css['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) css['transform'] = 'translate(-50%, -50%)';
  else if (transformX) css['transform'] = 'translateX(-50%)';
  else if (transformY) css['transform'] = 'translateY(-50%)';
}

function applyParametric(css: Record<string, string>, block: BlockNode): void {
  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) pname = sub.name;
    else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name; gap = sub.value;
    }
    if (!pname) continue;
    const parsed = parseParametric(pname);
    if (!parsed) continue;
    if (parsed.relation === 'below') css['margin-top'] = gap;
    else if (parsed.relation === 'above') css['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') css['margin-left'] = gap;
    else if (parsed.relation === 'left-of') css['margin-right'] = gap;
  }
}

/* ============ SLIDER RENDERER ============ */

function renderSlider(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};

  let min = '0';
  let max = '100';
  let step = '1';
  let value = '50';
  let fillColor = '#0a84ff';
  let trackColor = '#e0e0e0';
  let labelText = '';
  let showValue = true;

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'slider-min') { min = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-max') { max = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-step') { step = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-value') { value = child.value.replace('px', ''); continue; }
      if (propDef.special === 'slider-fill') { fillColor = child.value; continue; }
      if (propDef.special === 'slider-track') { trackColor = child.value; continue; }
      if (propDef.special === 'toggle-label') { labelText = child.value; continue; }
      if (propDef.special === 'slider-show-value') { showValue = child.value !== 'no'; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  // Positioning
  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    wrapperCss['position'] = 'absolute';
    if (hasTop) wrapperCss['top'] = '0';
    if (hasBottom) wrapperCss['bottom'] = '0';
    if (hasMiddle) { wrapperCss['top'] = '50%'; transformY = true; }
    if (hasLeft) wrapperCss['left'] = '0';
    if (hasRight) wrapperCss['right'] = '0';
    if (hasCenter) { wrapperCss['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      wrapperCss['align-self'] = 'center';
      if (!wrapperCss['margin-left']) wrapperCss['margin-left'] = 'auto';
      if (!wrapperCss['margin-right']) wrapperCss['margin-right'] = 'auto';
    }
    if (hasLeft) wrapperCss['align-self'] = 'flex-start';
    if (hasRight) {
      wrapperCss['align-self'] = 'flex-end';
      wrapperCss['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) wrapperCss['transform'] = 'translate(-50%, -50%)';
  else if (transformX) wrapperCss['transform'] = 'translateX(-50%)';
  else if (transformY) wrapperCss['transform'] = 'translateY(-50%)';

  // Parametric
  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) pname = sub.name;
    else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name; gap = sub.value;
    }
    if (!pname) continue;
    const parsed = parseParametric(pname);
    if (!parsed) continue;
    if (parsed.relation === 'below') wrapperCss['margin-top'] = gap;
    else if (parsed.relation === 'above') wrapperCss['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') wrapperCss['margin-left'] = gap;
    else if (parsed.relation === 'left-of') wrapperCss['margin-right'] = gap;
  }

  wrapperCss['--fill-color'] = fillColor;
  wrapperCss['--track-color'] = trackColor;

  cssRules[id] = wrapperCss;

  // Compute initial fill % for inline style
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  const valNum = parseFloat(value);
  const pct = maxNum > minNum ? ((valNum - minNum) / (maxNum - minNum)) * 100 : 50;
  const pctStr = pct.toFixed(2) + '%';

  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-slider-label">${escapeHtml(labelText)}</span>`
    : '';

  const valueHtml = showValue
    ? `\n${indent}  <span class="meeel-slider-value" id="${id}-value">${escapeHtml(value)}</span>`
    : '';

  // Unique script id to wire JS (minimal JS, no framework)
  const scriptId = `__meeel_slider_${id.replace(/[^a-z0-9]/g, '_')}`;

  return `${indent}<div id="${id}" class="meeel-slider">${labelHtml}
${indent}  <div class="meeel-slider-track">
${indent}    <div class="meeel-slider-fill" id="${id}-fill" style="width: ${pctStr}"></div>
${indent}    <input type="range" min="${escapeHtml(min)}" max="${escapeHtml(max)}" step="${escapeHtml(step)}" value="${escapeHtml(value)}"
${indent}      oninput="(function(el){
${indent}        var v = el.value;
${indent}        var min = parseFloat(el.min), max = parseFloat(el.max);
${indent}        var pct = ((v - min) / (max - min)) * 100;
${indent}        document.getElementById('${id}-fill').style.width = pct + '%';
${indent}        var thumb = document.getElementById('${id}-thumb');
${indent}        if (thumb) thumb.style.left = pct + '%';
${indent}        var val = document.getElementById('${id}-value');
${indent}        if (val) val.textContent = v;
${indent}      })(this)"
${indent}      onchange="(function(el){
${indent}        var v = el.value;
${indent}        var min = parseFloat(el.min), max = parseFloat(el.max);
${indent}        var pct = ((v - min) / (max - min)) * 100;
${indent}        document.getElementById('${id}-fill').style.width = pct + '%';
${indent}        var thumb = document.getElementById('${id}-thumb');
${indent}        if (thumb) thumb.style.left = pct + '%';
${indent}        var val = document.getElementById('${id}-value');
${indent}        if (val) val.textContent = v;
${indent}        document.documentElement.style.setProperty('--${id}-value', v);
${indent}      })(this)">
${indent}    <div class="meeel-slider-thumb" id="${id}-thumb" style="left: ${pctStr}"></div>
${indent}  </div>${valueHtml}
${indent}</div>`;
}

/* ============ PROGRESS BAR RENDERER ============ */

function renderProgressBar(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};

  let value = '50';
  let fillColor = '#0a84ff';
  let trackColor = '#e0e0e0';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'slider-value') { value = child.value; continue; }
      if (propDef.special === 'slider-fill') { fillColor = child.value; continue; }
      if (propDef.special === 'slider-track') { trackColor = child.value; continue; }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    wrapperCss['position'] = 'absolute';
    if (hasTop) wrapperCss['top'] = '0';
    if (hasBottom) wrapperCss['bottom'] = '0';
    if (hasMiddle) { wrapperCss['top'] = '50%'; transformY = true; }
    if (hasLeft) wrapperCss['left'] = '0';
    if (hasRight) wrapperCss['right'] = '0';
    if (hasCenter) { wrapperCss['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      wrapperCss['align-self'] = 'center';
      if (!wrapperCss['margin-left']) wrapperCss['margin-left'] = 'auto';
      if (!wrapperCss['margin-right']) wrapperCss['margin-right'] = 'auto';
    }
    if (hasLeft) wrapperCss['align-self'] = 'flex-start';
    if (hasRight) {
      wrapperCss['align-self'] = 'flex-end';
      wrapperCss['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) wrapperCss['transform'] = 'translate(-50%, -50%)';
  else if (transformX) wrapperCss['transform'] = 'translateX(-50%)';
  else if (transformY) wrapperCss['transform'] = 'translateY(-50%)';

  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) pname = sub.name;
    else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name; gap = sub.value;
    }
    if (!pname) continue;
    const parsed = parseParametric(pname);
    if (!parsed) continue;
    if (parsed.relation === 'below') wrapperCss['margin-top'] = gap;
    else if (parsed.relation === 'above') wrapperCss['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') wrapperCss['margin-left'] = gap;
    else if (parsed.relation === 'left-of') wrapperCss['margin-right'] = gap;
  }

  wrapperCss['--fill-color'] = fillColor;
  wrapperCss['--track-color'] = trackColor;

  cssRules[id] = wrapperCss;

  // Convert value to percentage if it's a number, else assume %
  let pct = value;
  if (!pct.endsWith('%')) {
    const num = parseFloat(pct);
    if (!isNaN(num)) pct = Math.max(0, Math.min(100, num)) + '%';
    else pct = '50%';
  }

  return `${indent}<div id="${id}" class="meeel-progress">
${indent}  <div class="meeel-progress-fill" style="width: ${escapeHtml(pct)}"></div>
${indent}</div>`;
}

/* ============ TOGGLE RENDERER ============ */

function renderToggle(
  block: BlockNode,
  cssRules: CSSBucket,
  indent: string
): string {
  const id = block.name;
  const wrapperCss: Record<string, string> = {};
  let onColor = '#16a34a';
  let offColor = '#555';
  let defaultChecked = false;
  let labelText = '';

  let hasTop = false, hasBottom = false, hasMiddle = false;
  let hasLeft = false, hasRight = false, hasCenter = false;

  for (const child of block.children) {
    if (child.kind === 'keyword') {
      const kw = child.name;
      if (POSITION_KEYWORDS.has(kw)) {
        switch (kw) {
          case 'top': hasTop = true; break;
          case 'bottom': hasBottom = true; break;
          case 'middle': hasMiddle = true; break;
          case 'left': hasLeft = true; break;
          case 'right': hasRight = true; break;
          case 'center': hasCenter = true; break;
        }
      } else if (KEYWORD_CSS[kw]) {
        Object.assign(wrapperCss, KEYWORD_CSS[kw]);
      }
    } else if (child.kind === 'property') {
      if (isParametricKeyword(child.name)) continue;
      const propDef = PROPERTIES[child.name];
      if (!propDef) continue;

      if (propDef.special === 'toggle-on-color') {
        onColor = child.value;
        continue;
      }
      if (propDef.special === 'toggle-off-color') {
        offColor = child.value;
        continue;
      }
      if (propDef.special === 'toggle-state') {
        defaultChecked = child.value === 'on';
        continue;
      }
      if (propDef.special === 'toggle-label') {
        labelText = child.value;
        continue;
      }
      if (propDef.special) continue;

      const val = propDef.transform ? propDef.transform(child.value) : child.value;
      wrapperCss[propDef.css] = val;
    }
  }

  // Positioning
  const verticalFix = hasTop || hasBottom || hasMiddle;
  let transformX = false, transformY = false;

  if (verticalFix) {
    wrapperCss['position'] = 'absolute';
    if (hasTop) wrapperCss['top'] = '0';
    if (hasBottom) wrapperCss['bottom'] = '0';
    if (hasMiddle) { wrapperCss['top'] = '50%'; transformY = true; }
    if (hasLeft) wrapperCss['left'] = '0';
    if (hasRight) wrapperCss['right'] = '0';
    if (hasCenter) { wrapperCss['left'] = '50%'; transformX = true; }
  } else {
    if (hasCenter) {
      wrapperCss['align-self'] = 'center';
      if (!wrapperCss['margin-left']) wrapperCss['margin-left'] = 'auto';
      if (!wrapperCss['margin-right']) wrapperCss['margin-right'] = 'auto';
    }
    if (hasLeft) wrapperCss['align-self'] = 'flex-start';
    if (hasRight) {
      wrapperCss['align-self'] = 'flex-end';
      wrapperCss['margin-left'] = 'auto';
    }
  }

  if (transformX && transformY) wrapperCss['transform'] = 'translate(-50%, -50%)';
  else if (transformX) wrapperCss['transform'] = 'translateX(-50%)';
  else if (transformY) wrapperCss['transform'] = 'translateY(-50%)';

  // Parametric
  for (const sub of block.children) {
    let pname: string | null = null;
    let gap = '0px';
    if (sub.kind === 'keyword' && isParametricKeyword(sub.name)) {
      pname = sub.name;
    } else if (sub.kind === 'property' && isParametricKeyword(sub.name)) {
      pname = sub.name;
      gap = sub.value;
    }
    if (!pname) continue;
    const parsed = parseParametric(pname);
    if (!parsed) continue;
    if (parsed.relation === 'below') wrapperCss['margin-top'] = gap;
    else if (parsed.relation === 'above') wrapperCss['margin-bottom'] = gap;
    else if (parsed.relation === 'right-of') wrapperCss['margin-left'] = gap;
    else if (parsed.relation === 'left-of') wrapperCss['margin-right'] = gap;
  }

  // Per-toggle CSS variables for colors
  wrapperCss['--on-color'] = onColor;
  wrapperCss['--off-color'] = offColor;

  cssRules[id] = wrapperCss;

  const labelHtml = labelText
    ? `\n${indent}  <span class="meeel-toggle-label">${escapeHtml(labelText)}</span>`
    : '';
  const checkedAttr = defaultChecked ? ' checked' : '';

  return `${indent}<label id="${id}" class="meeel-toggle">
${indent}  <input type="checkbox"${checkedAttr}>
${indent}  <span class="meeel-toggle-slider"></span>${labelHtml}
${indent}</label>`;
}

/* ============ JAVASCRIPT GENERATOR ============ */

function generateJavaScript(
  handlers: Array<{ elementId: string; actions: string[] }>,
  timers: Array<{ period: number; actions: string[] }> = []
): string {
  if (handlers.length === 0 && timers.length === 0) return '';

  const lines: string[] = [];
  lines.push('/* meeEL — generated script */');
  lines.push('(function () {');
  lines.push("  'use strict';");
  lines.push('');
  lines.push('  // Fuzzy element finder: handles keep- prefix, suffix matches');
  lines.push('  function __meeel_find(target) {');
  lines.push('    if (!target) return null;');
  lines.push('    var el = document.getElementById(target);');
  lines.push('    if (el) return el;');
  lines.push('    if (target.indexOf("keep-") === 0) {');
  lines.push('      el = document.getElementById(target.slice(5));');
  lines.push('      if (el) return el;');
  lines.push('    } else {');
  lines.push('      el = document.getElementById("keep-" + target);');
  lines.push('      if (el) return el;');
  lines.push('    }');
  lines.push('    // Legacy var- prefix support');
  lines.push('    if (target.indexOf("var-") === 0) {');
  lines.push('      el = document.getElementById(target.slice(4));');
  lines.push('      if (el) return el;');
  lines.push('    }');
  lines.push('    el = document.querySelector(\'[id$="-\' + target + \'"]\');');
  lines.push('    if (el) return el;');
  lines.push('    el = document.querySelector(\'[id^="\' + target + \'-"]\');');
  lines.push('    if (el) return el;');
  lines.push('    return null;');
  lines.push('  }');
  lines.push('');
  lines.push('  // Condition checker: __meeel_check(target, op, value)');
  lines.push('  function __meeel_check(target, op, val) {');
  lines.push('    var el = __meeel_find(target);');
  lines.push('    if (!el) return false;');
  lines.push('    var text = (el.textContent || \'\').trim();');
  lines.push('    var n = Number(val);');
  lines.push('    var isNum = !isNaN(n) && isFinite(n);');
  lines.push('    if (isNum) {');
  lines.push('      var cur = parseInt(text, 10) || 0;');
  lines.push('      if (op === \'===\') return cur === n;');
  lines.push('      if (op === \'!==\') return cur !== n;');
  lines.push('      if (op === \'>\') return cur > n;');
  lines.push('      if (op === \'<\') return cur < n;');
  lines.push('      if (op === \'>=\') return cur >= n;');
  lines.push('      if (op === \'<=\') return cur <= n;');
  lines.push('    } else {');
  lines.push('      if (op === \'===\') return text === val;');
  lines.push('      if (op === \'!==\') return text !== val;');
  lines.push('    }');
  lines.push('    return false;');
  lines.push('  }');

  for (const h of handlers) {
    lines.push('');
    lines.push(`  var __root = __meeel_find(${JSON.stringify(h.elementId)}); if (__root) __root.addEventListener('click', function () {`);
    for (const act of h.actions) {
      const code = actionToJs(act);
      if (code) lines.push('    ' + code);
    }
    lines.push('  });');
  }

  for (const t of timers) {
    lines.push('');
    lines.push('  setInterval(function () {');
    for (const act of t.actions) {
      const code = actionToJs(act);
      if (code) lines.push('    ' + code);
    }
    lines.push('  }, ' + t.period + ');');
  }

  lines.push('');
  lines.push('})();');
  return lines.join('\n');
}

function actionToJs(action: string): string {
  const trimmed = action.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  const verb = parts[0];
  const target = parts[1];

  // Target-less verbs (no element target needed)
  if (verb === 'beep') {
    return `try { var __actx = new (window.AudioContext || window.webkitAudioContext)(); var __osc = __actx.createOscillator(); var __gain = __actx.createGain(); __osc.connect(__gain); __gain.connect(__actx.destination); __osc.frequency.value = 880; __osc.type = 'sine'; __gain.gain.setValueAtTime(0.4, __actx.currentTime); __gain.gain.exponentialRampToValueAtTime(0.001, __actx.currentTime + 0.8); __osc.start(); __osc.stop(__actx.currentTime + 0.8); } catch(e) { console.warn('beep failed', e); }`;
  }
  if (verb === 'vibrate') {
    return `if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);`;
  }
  if (verb === 'notify') {
    const msg = parts.slice(1).join(' ') || 'Notification';
    const mq = JSON.stringify(msg);
    return `try { if (window.Notification && Notification.permission === 'granted') { try { new Notification(${mq}); } catch(e) {} } else if (window.Notification && Notification.permission !== 'denied') { Notification.requestPermission().then(function(p) { if (p === 'granted') { try { new Notification(${mq}); } catch(e) {} } }); } } catch(e) {}`;
  }

  if (!target) return '';

  const tq = JSON.stringify(target);

  switch (verb) {
    case 'if': {
      // Syntax: if <target> <cmp> [and|or <target> <cmp>]* <action...>
      // Example: if running is-1 and remaining is-greater-than-0 decrement remaining

      const conditions: Array<{ target: string; jsOp: string; value: string }> = [];
      const logicalOps: string[] = [];
      let idx = 1;

      while (idx < parts.length) {
        const tgt = parts[idx];
        const cmp = parts[idx + 1];
        if (!tgt || !cmp) return '';
        if (!cmp.startsWith('is-')) break;  // action begins

        let jsOp = '===';
        let cmpValue = '';

        if (cmp.startsWith('is-not-')) {
          jsOp = '!==';
          cmpValue = cmp.slice(7);
        } else if (cmp.startsWith('is-greater-than-')) {
          jsOp = '>';
          cmpValue = cmp.slice(16);
        } else if (cmp.startsWith('is-less-than-')) {
          jsOp = '<';
          cmpValue = cmp.slice(13);
        } else if (cmp.startsWith('is-at-least-')) {
          jsOp = '>=';
          cmpValue = cmp.slice(12);
        } else if (cmp.startsWith('is-at-most-')) {
          jsOp = '<=';
          cmpValue = cmp.slice(11);
        } else if (cmp.startsWith('is-')) {
          jsOp = '===';
          cmpValue = cmp.slice(3);
        } else {
          break;
        }

        conditions.push({ target: tgt, jsOp, value: cmpValue });
        idx += 2;

        if (idx < parts.length && (parts[idx] === 'and' || parts[idx] === 'or')) {
          logicalOps.push(parts[idx] === 'and' ? '&&' : '||');
          idx += 1;
          continue;
        }
        break;
      }

      if (conditions.length === 0) return '';

      const subAction = parts.slice(idx).join(' ');
      if (!subAction) return '';

      const subJs = actionToJs(subAction);
      if (!subJs) return '';

      // Build condition expression
      const condExprs = conditions.map((c) => {
        const tq = JSON.stringify(c.target);
        const opq = JSON.stringify(c.jsOp);
        const vq = JSON.stringify(c.value);
        return `__meeel_check(${tq}, ${opq}, ${vq})`;
      });

      let combined = condExprs[0];
      for (let i = 0; i < logicalOps.length; i++) {
        combined = `(${combined}) ${logicalOps[i]} (${condExprs[i + 1]})`;
      }

      return `if (${combined}) { ${subJs} }`;
    }
    case 'show':
      return `var el = __meeel_find(${tq}); if (el) el.style.setProperty('display', 'block', 'important');`;
    case 'hide':
      return `var el = __meeel_find(${tq}); if (el) el.style.setProperty('display', 'none', 'important');`;
    case 'toggle':
      return `var el = __meeel_find(${tq}); if (el) { var cs = getComputedStyle(el).display; var h = cs === 'none'; el.style.setProperty('display', h ? 'block' : 'none', 'important'); }`;
    case 'increase':
      return `var el = __meeel_find(${tq}); if (el) el.textContent = String((parseInt(el.textContent, 10) || 0) + 1);`;
    case 'decrease':
      return `var el = __meeel_find(${tq}); if (el) el.textContent = String((parseInt(el.textContent, 10) || 0) - 1);`;
    case 'write': {
      const value = parts.slice(2).join(' ');
      return `var el = __meeel_find(${tq}); if (el) el.textContent = ${JSON.stringify(value)};`;
    }
    case 'paint': {
      const value = parts.slice(2).join(' ');
      return `var el = __meeel_find(${tq}); if (el) el.style.color = ${JSON.stringify(value)};`;
    }
    case 'fill': {
      const value = parts.slice(2).join(' ');
      return `var el = __meeel_find(${tq}); if (el) el.style.backgroundColor = ${JSON.stringify(value)};`;
    }
    case 'add': {
      const num = parseFloat(parts[2]) || 0;
      return `var el = __meeel_find(${tq}); if (el) el.textContent = String((parseInt(el.textContent, 10) || 0) + ${num});`;
    }
    case 'subtract': {
      const num = parseFloat(parts[2]) || 0;
      return `var el = __meeel_find(${tq}); if (el) el.textContent = String((parseInt(el.textContent, 10) || 0) - ${num});`;
    }
    case 'multiply': {
      const num = parseFloat(parts[2]) || 0;
      return `var el = __meeel_find(${tq}); if (el) el.textContent = String((parseInt(el.textContent, 10) || 0) * ${num});`;
    }
    case 'make': {
      const value = parts.slice(2).join(' ');
      const num = parseFloat(value);
      if (!isNaN(num) && isFinite(num)) {
        return `var el = __meeel_find(${tq}); if (el) el.textContent = String(${num});`;
      }
      return `var el = __meeel_find(${tq}); if (el) el.textContent = ${JSON.stringify(value)};`;
    }
    case 'copy-from': {
      // Syntax: show-data <target> <source>
      // Copies source.textContent into target.textContent
      const source = parts[2];
      if (!source) return '';
      const sq = JSON.stringify(source);
      return `var src = __meeel_find(${sq}); var tgt = __meeel_find(${tq}); if (src && tgt) tgt.textContent = src.textContent;`;
    }
    case 'bring': {
      // Syntax: fetch-from <url> save-to <target>
      // target = parts[1] = URL, parts[2] = 'save-to', parts[3] = element id
      const url = parts[1];
      const saveToKeyword = parts[2];
      const saveTarget = parts[3];
      if (!url || saveToKeyword !== 'save-to' || !saveTarget) return '';
      const stq = JSON.stringify(saveTarget);
      return `var __target = __meeel_find(${stq}); if (__target) __target.textContent = 'Loading...'; fetch(${JSON.stringify(url)}).then(function(r){ return r.text(); }).then(function(data){ if (__target) __target.textContent = data; }).catch(function(err){ if (__target) __target.textContent = 'Error: ' + err.message; });`;
    }
    case 'bring-json': {
      // Syntax: fetch-json <url> save-to <target>
      // Same as fetch-from but parses JSON
      const url = parts[1];
      const saveToKeyword = parts[2];
      const saveTarget = parts[3];
      if (!url || saveToKeyword !== 'save-to' || !saveTarget) return '';
      const stq = JSON.stringify(saveTarget);
      return `var __target = __meeel_find(${stq}); if (__target) __target.textContent = 'Loading...'; fetch(${JSON.stringify(url)}).then(function(r){ return r.json(); }).then(function(data){ if (__target) __target.textContent = JSON.stringify(data, null, 2); }).catch(function(err){ if (__target) __target.textContent = 'Error: ' + err.message; });`;
    }
    case 'remember': {
      // Syntax: save-data <key> from <target>
      // Saves target.textContent into localStorage[key]
      const key = parts[1];
      const fromKeyword = parts[2];
      const fromTarget = parts[3];
      if (!key) return '';
      const kq = JSON.stringify(key);
      if (fromKeyword === 'from' && fromTarget) {
        const ftq = JSON.stringify(fromTarget);
        return `var __src = __meeel_find(${ftq}); if (__src) localStorage.setItem(${kq}, __src.textContent);`;
      }
      // save-data <key> from-value <value>
      if (fromKeyword === 'from-value') {
        const value = parts.slice(3).join(' ');
        return `localStorage.setItem(${kq}, ${JSON.stringify(value)});`;
      }
      return '';
    }
    case 'recall': {
      // Syntax: load-data <key> into <target>
      const key = parts[1];
      const intoKeyword = parts[2];
      const intoTarget = parts[3];
      if (!key || intoKeyword !== 'into' || !intoTarget) return '';
      const kq = JSON.stringify(key);
      const itq = JSON.stringify(intoTarget);
      return `var __tgt = __meeel_find(${itq}); var __val = localStorage.getItem(${kq}); if (__tgt && __val !== null) __tgt.textContent = __val;`;
    }
    case 'forget': {
      // Syntax: clear-data <key>
      const key = parts[1];
      if (!key) return '';
      return `localStorage.removeItem(${JSON.stringify(key)});`;
    }
    case 'roll': {
      // Syntax: set-random <target> <min>-<max>
      // Example: set-random dice-text 1-6
      const range = parts[2];
      if (!range) return '';
      const match = range.match(/^(-?\d+)-(\d+)$/);
      if (!match) return '';
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return `var el = __meeel_find(${tq}); if (el) el.textContent = String(Math.floor(Math.random() * (${max} - ${min} + 1)) + ${min});`;
    }
    case 'show-as-time': {
      // Syntax: format-time <target> <source>
      // Reads numeric seconds from source, writes HH:MM:SS to target
      const sourceId = parts[2];
      if (!sourceId) return '';
      const sq = JSON.stringify(sourceId);
      return `var __src = __meeel_find(${sq}); var __tgt = __meeel_find(${tq}); if (__src && __tgt) { var __secs = parseInt(__src.textContent, 10) || 0; var __h = Math.floor(__secs / 3600); var __m = Math.floor((__secs % 3600) / 60); var __s = __secs % 60; __tgt.textContent = String(__h).padStart(2, '0') + ':' + String(__m).padStart(2, '0') + ':' + String(__s).padStart(2, '0'); }`;
    }
case 'beep': {
      return `try { var __actx = new (window.AudioContext || window.webkitAudioContext)(); var __osc = __actx.createOscillator(); var __gain = __actx.createGain(); __osc.connect(__gain); __gain.connect(__actx.destination); __osc.frequency.value = 880; __osc.type = 'sine'; __gain.gain.setValueAtTime(0.4, __actx.currentTime); __gain.gain.exponentialRampToValueAtTime(0.001, __actx.currentTime + 0.8); __osc.start(); __osc.stop(__actx.currentTime + 0.8); } catch(e) { console.warn('beep failed', e); }`;
    }
    case 'vibrate': {
      return `if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);`;
    }
    case 'notify': {
      const msgParts = parts.slice(2).join(' ') || 'Timer finished';
      const mq = JSON.stringify(msgParts);
      return `try { if (window.Notification && Notification.permission === 'granted') { try { new Notification(${mq}); } catch(e) { console.warn('notify failed', e); } } else if (window.Notification && Notification.permission !== 'denied') { Notification.requestPermission().then(function(p) { if (p === 'granted') { try { new Notification(${mq}); } catch(e) {} } }); } } catch(e) {}`;
    }
        case 'total-time': {
      // Syntax: compute-time <target> from <hours-src> <minutes-src> <seconds-src>
      const cTarget = parts[1];
      const fromKw = parts[2];
      const hSrc = parts[3];
      const mSrc = parts[4];
      const sSrc = parts[5];
      if (!cTarget || fromKw !== 'from' || !hSrc || !mSrc || !sSrc) return '';
      const tq2 = JSON.stringify(cTarget);
      const hq = JSON.stringify(hSrc);
      const mq = JSON.stringify(mSrc);
      const sq = JSON.stringify(sSrc);
      return `var __tgt = __meeel_find(${tq2}); var __h = __meeel_find(${hq}); var __m = __meeel_find(${mq}); var __s = __meeel_find(${sq}); if (__tgt) { var __hv = __h ? (parseInt((__h.value !== undefined && __h.value !== null) ? __h.value : __h.textContent, 10) || 0) : 0; var __mv = __m ? (parseInt((__m.value !== undefined && __m.value !== null) ? __m.value : __m.textContent, 10) || 0) : 0; var __sv = __s ? (parseInt((__s.value !== undefined && __s.value !== null) ? __s.value : __s.textContent, 10) || 0) : 0; __tgt.textContent = String(__hv * 3600 + __mv * 60 + __sv); }`;
    }
    case 'load-video': {
      // Syntax: load-video <target> from <source-input>
      const videoTarget = parts[1];
      const fromKw = parts[2];
      const urlSource = parts[3];
      if (!videoTarget || fromKw !== 'from' || !urlSource) return '';
      const vtq = JSON.stringify(videoTarget);
      const usq = JSON.stringify(urlSource);
      return `var __tgt = __meeel_find(${vtq}); var __src = __meeel_find(${usq}); if (__tgt && __src) { var __url = (__src.value !== undefined && __src.value !== null) ? __src.value : (__src.textContent || ''); __url = __url.trim(); if (__url) { var __yt = __url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) || __url.match(/youtu\\.be\\/([A-Za-z0-9_-]{6,})/) || __url.match(/\\/embed\\/([A-Za-z0-9_-]{6,})/) || __url.match(/\\/shorts\\/([A-Za-z0-9_-]{6,})/); if (__yt) { __tgt.innerHTML = '<iframe src="https://www.youtube.com/embed/' + __yt[1] + '" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>'; } else { __tgt.innerHTML = '<video controls playsinline><source src="' + __url + '" type="video/mp4"></video>'; } } }`;
    }
    default:
      return '';
  }
}

/* ============ LOOP HELPER ============ */

function cloneBlockWithSuffix(block: BlockNode, suffix: string): BlockNode {
  return {
    kind: 'block',
    name: block.name + '-' + suffix,
    children: block.children.map((child) => {
      if (child.kind === 'block') {
        return cloneBlockWithSuffix(child, suffix);
      }
      return { ...child };
    }),
    line: block.line,
  };
}
