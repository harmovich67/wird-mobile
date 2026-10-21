import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

/**
 * Plays a list of audio URLs one after another (ayahs of a passage, words of an example).
 * One native player is reused across runs; `playingKey` says which item is currently playing.
 */
export function usePlaylist(onError?: () => void) {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const runRef = useRef(0);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const stop = useCallback(() => {
    runRef.current += 1; // invalidates any listener still attached to the previous run
    try { subRef.current?.remove(); } catch {}
    subRef.current = null;
    try { playerRef.current?.pause(); } catch {}
    setPlayingKey(null);
  }, []);

  const play = useCallback(
    (key: string, urls: string[], loop: boolean = false) => {
      stop();
      if (!urls.length) return;

      const run = runRef.current;
      let i = 0;
      setPlayingKey(key);

      const playCurrent = () => {
        if (runRef.current !== run) return;
        try {
          const url = urls[i];
          if (!playerRef.current) {
            playerRef.current = createAudioPlayer(url);
          } else {
            playerRef.current.replace(url);
          }
          if (!subRef.current) {
            subRef.current = playerRef.current.addListener('playbackStatusUpdate', (status) => {
              if (runRef.current !== run || !status.didJustFinish) return;
              i += 1;
              if (i >= urls.length) {
                if (!loop) {
                  stop();
                  return;
                }
                i = 0;
              }
              playCurrent();
            });
          }
          playerRef.current.play();
        } catch {
          stop();
          onErrorRef.current?.();
        }
      };

      playCurrent();
    },
    [stop]
  );

  const toggle = useCallback(
    (key: string, urls: string[], loop: boolean = false) => {
      if (playingKey === key) stop();
      else play(key, urls, loop);
    },
    [playingKey, play, stop]
  );

  useEffect(() => {
    return () => {
      runRef.current += 1;
      try { subRef.current?.remove(); } catch {}
      try { playerRef.current?.release(); } catch {}
      playerRef.current = null;
    };
  }, []);

  return { playingKey, play, stop, toggle };
}
