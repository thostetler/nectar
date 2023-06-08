import { Button } from '@chakra-ui/button';
import { HTMLAttributes, ReactElement, Reducer, useEffect, useReducer, useRef } from 'react';
import { assoc } from 'ramda';
import { Icon, IconButton } from '@chakra-ui/react';
import { BackwardIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/solid';
import { IDocsEntity } from '@api';
import { useQuery } from 'react-query';
import axios from 'axios';
import { PlayingAnimation } from '@components/Speak/PlayingAnimation';

type SpeakState = {
  playing: boolean;
  position: number;
};
type SpeakEvent = { type: 'PLAYPAUSE' } | { type: 'SEEK'; position: number };
export interface ISpeakProps extends HTMLAttributes<HTMLButtonElement> {
  doc: IDocsEntity;
}

const initialState: SpeakState = {
  playing: false,
  position: 0,
};
export const Speak = (props: ISpeakProps): ReactElement => {
  const { doc } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const params = {
    text: doc.abstract.slice(0, 100),
    author: doc.author[0],
    authorCount: doc.author_count,
    ...(!!doc.title ? { title: doc.title[0] } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['/api/speech', params] as [string, typeof params],
    queryFn: async ({ queryKey }) => {
      const { data } = await axios.request<{ blob: string }>({
        method: 'post',
        url: queryKey[0],
        data: queryKey[1],
      });
      return data.blob;
    },
    enabled: state.playing,
  });

  useEffect(() => {
    if (data && !audioRef.current) {
      audioRef.current = new Audio(`data:audio/mp3;base64,${data ?? ''}`);
      audioRef.current.onended = () => {
        dispatch({ type: 'PLAYPAUSE' });
        audioRef.current.currentTime = 0;
      };
    }

    if (state.playing && audioRef.current) {
      void audioRef.current.play();
    }
    if (!state.playing && audioRef.current) {
      void audioRef.current.pause();
    }
    if (state.playing && typeof state.position === 'number' && audioRef.current) {
      audioRef.current.currentTime = state.position;
      void audioRef.current.pause();
      dispatch({ type: 'SEEK', position: null });
    }
  }, [state.playing, state.position, data]);

  return (
    <>
      {data ? (
        <>
          <IconButton
            size="sm"
            icon={<Icon as={BackwardIcon} />}
            aria-label="restart"
            onClick={() => dispatch({ type: 'SEEK', position: 0 })}
          />
          <IconButton
            size="sm"
            aria-label="play/pause"
            icon={<Icon as={state.playing ? PauseIcon : PlayIcon} />}
            onClick={() => dispatch({ type: 'PLAYPAUSE' })}
          />
          <PlayingAnimation playing={state.playing} />
        </>
      ) : (
        <Button
          size="sm"
          onClick={() => dispatch({ type: 'PLAYPAUSE' })}
          rightIcon={<Icon as={PlayIcon} />}
          isLoading={isLoading}
        >
          Listen to Abstract
        </Button>
      )}
    </>
  );
};

const reducer: Reducer<SpeakState, SpeakEvent> = (state, action) => {
  switch (action.type) {
    case 'PLAYPAUSE':
      return assoc('playing', !state.playing, state);
    case 'SEEK':
      return assoc('position', action.position, state);
    default:
      return state;
  }
};
