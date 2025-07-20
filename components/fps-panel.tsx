'use client';

import { SettingsContext } from '@/shared/settings-context';
import { useContext, useDeferredValue, useEffect, useState } from 'react';

type State =
  | {
      type: 'initializing';
      frameId: number;
    }
  | {
      type: 'running';
      frameId: number;
      timeLastFrameFinished: number;
      fpsValues: number[];
    };

export function FPSPanel() {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const deferredValue = useDeferredValue(displayValue);
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    if (!settings.isCPUBurnEnabled) {
      return;
    }
    function burn() {
      console.log('hurting CPU');
      const start = Date.now();
      while (Date.now() - start < 50) {
        // block CPU
      }
    }

    const timerId = setInterval(burn);

    return function cleanup() {
      clearInterval(timerId);
    };
  }, [settings]);

  useEffect(() => {
    let state: State = {
      type: 'initializing',
      frameId: requestAnimationFrame((timeLastFrameFinished) => {
        state = {
          type: 'running',
          fpsValues: [],
          timeLastFrameFinished,
          frameId: schedule(),
        };
      }),
    };

    function schedule() {
      return requestAnimationFrame((timeLastFrameFinished) => {
        if (state.type !== 'running') {
          return;
        }

        const diff = timeLastFrameFinished - state.timeLastFrameFinished;

        // protecting against bad data.
        // Sometimes the first frame can be 0ms
        if (diff <= 0) {
          state = {
            type: 'running',
            fpsValues: state.fpsValues,
            timeLastFrameFinished,
            frameId: schedule(),
          };
          return;
        }

        const fps = 1000 / diff;
        const fpsValues = [...state.fpsValues, fps];

        if (fpsValues.length >= 10) {
          const sum = fpsValues.reduce((acc, current) => acc + current, 0);
          const average = sum / fpsValues.length;
          const rounded = Math.round(average);
          fpsValues.length = 0;
          setDisplayValue(rounded);
        }

        state = {
          type: 'running',
          fpsValues,
          timeLastFrameFinished,
          frameId: schedule(),
        };
      });
    }

    return function cleanup() {
      cancelAnimationFrame(state.frameId);
    };
  }, []);

  return typeof deferredValue === 'number' ? (
    <div className="flex flex-row items-center gap-1 overflow-hidden text-white">
      {settings.isCPUBurnEnabled ? <span>🔥</span> : null}
      <span className="">FPS:</span>
      <span className="min-w-[3ch] font-bold">{deferredValue}</span>
    </div>
  ) : null;
}
