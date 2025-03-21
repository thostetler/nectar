import { ToastId, useToast } from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { usePathname } from 'next/navigation';

const TIMEOUT = 10000;

export const Notification = () => {
  const toastId = useRef<ToastId>(null);
  const pathname = usePathname();
  const timeoutId = useRef<NodeJS.Timeout>(null);
  const notification = useStore((state) => state.notification);
  const resetNotification = useStore((state) => state.resetNotification);
  const toast = useToast({
    position: 'top',
    duration: TIMEOUT,
    isClosable: true,
    variant: 'subtle',
  });

  // Reset notification (clear from store and close toast)
  const reset = useCallback(() => {
    resetNotification();
    clearTimeout(timeoutId.current);
    if (toastId.current) {
      toast.close(toastId.current);
    }
  }, [resetNotification, toast]);

  // Show notification
  useEffect(() => {
    if (notification !== null && !toast.isActive(toastId.current)) {
      clearTimeout(timeoutId.current);
      toastId.current = toast({
        id: notification?.id,
        description: notification?.message,
        status: notification?.status,
        onCloseComplete: resetNotification,
      });
    }
    return () => {
      timeoutId.current = setTimeout(reset, TIMEOUT);
    };
  }, [notification, resetNotification, toast, reset]);

  const once = useRef(false);
  useEffect(() => {
    if (once.current) {
      reset();
    }
    once.current = true;
  }, [pathname, reset]);

  return <></>;
};
