import { Box, HStack } from '@chakra-ui/react';
import { useEffect, useRef, useState, useTransition } from 'react';

const getRanHeight = () => Math.floor(Math.random() * 90) + 10;
export const PlayingAnimation = (props: { playing: boolean }) => {
  return (
    <HStack spacing="2px" alignItems="center" h="8">
      {new Array(12).fill(0).map((_, i) => (
        <Box h="4" position="relative" key={i}>
          <Bar playing={props.playing} />
        </Box>
      ))}
    </HStack>
  );
};

const delay = 500;

const Bar = (props: { playing: boolean }) => {
  const [isPending, startTransition] = useTransition();
  const [height, setHeight] = useState(10);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const heightRef = useRef(height);
  useEffect(() => {
    if (!timer.current) {
      timer.current = setInterval(
        () => requestAnimationFrame(() => startTransition(() => setHeight(getRanHeight()))),
        delay,
      );
    }

    () => clearInterval(timer.current);
  }, []);

  useEffect(() => {
    if (props.playing) {
      startTransition(() => {
        heightRef.current = height;
      });
    } else {
      startTransition(() => {
        heightRef.current = 10;
      });
    }
  }, [height, props.playing]);

  return (
    <Box
      position="absolute"
      bottom="0"
      backgroundColor="blue.500"
      h={`${heightRef.current}%`}
      w="4px"
      transition={'.7s height ease-out, .5s width ease-out'}
    />
  );
};
