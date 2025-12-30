import { useCallback, useRef, useEffect } from 'react';
import { useChatSettings } from './useChatSettings';

// Sound file URLs (using base64 data URIs for reliability)
// These are simple notification sounds generated as base64
const SOUNDS = {
  default: '/sounds/message-pop.mp3',
  chime: '/sounds/chime.mp3',
  ding: '/sounds/ding.mp3',
  subtle: '/sounds/subtle.mp3',
};

export type SoundOption = keyof typeof SOUNDS;

export function useMessageSounds() {
  const { settings } = useChatSettings();
  const incomingSoundRef = useRef<HTMLAudioElement | null>(null);
  const outgoingSoundRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio elements
  useEffect(() => {
    const soundUrl = SOUNDS[settings.notification_sound as SoundOption] || SOUNDS.default;
    
    // Create audio elements
    incomingSoundRef.current = new Audio(soundUrl);
    incomingSoundRef.current.preload = 'auto';
    incomingSoundRef.current.volume = 0.5;
    
    outgoingSoundRef.current = new Audio(soundUrl);
    outgoingSoundRef.current.preload = 'auto';
    outgoingSoundRef.current.volume = 0.3;

    return () => {
      incomingSoundRef.current = null;
      outgoingSoundRef.current = null;
    };
  }, [settings.notification_sound]);

  const playIncomingSound = useCallback(() => {
    if (!settings.incoming_sound_enabled) return;
    
    try {
      if (incomingSoundRef.current) {
        incomingSoundRef.current.currentTime = 0;
        incomingSoundRef.current.play().catch(() => {
          // Browser may block autoplay - this is expected
          console.log('Incoming sound blocked by browser autoplay policy');
        });
      }
    } catch (error) {
      console.log('Could not play incoming sound:', error);
    }
  }, [settings.incoming_sound_enabled]);

  const playOutgoingSound = useCallback(() => {
    if (!settings.outgoing_sound_enabled) return;
    
    try {
      if (outgoingSoundRef.current) {
        outgoingSoundRef.current.currentTime = 0;
        outgoingSoundRef.current.play().catch(() => {
          // Browser may block autoplay - this is expected
          console.log('Outgoing sound blocked by browser autoplay policy');
        });
      }
    } catch (error) {
      console.log('Could not play outgoing sound:', error);
    }
  }, [settings.outgoing_sound_enabled]);

  const previewSound = useCallback((sound: SoundOption) => {
    try {
      const audio = new Audio(SOUNDS[sound] || SOUNDS.default);
      audio.volume = 0.5;
      audio.play().catch(() => {
        console.log('Preview sound blocked by browser');
      });
    } catch (error) {
      console.log('Could not preview sound:', error);
    }
  }, []);

  const vibrate = useCallback(() => {
    if (!settings.vibration_enabled) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }, [settings.vibration_enabled]);

  return {
    playIncomingSound,
    playOutgoingSound,
    previewSound,
    vibrate,
    soundOptions: Object.keys(SOUNDS) as SoundOption[],
  };
}
