import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { IconButton, IconButtonProps, useClipboard, UseClipboardOptions } from '@chakra-ui/react';
import { ReactElement, useEffect } from 'react';

export interface ICopyButtonProps extends Omit<IconButtonProps, 'aria-label'> {
  text: string;
  options?: UseClipboardOptions;
}

export const CopyButton = (props: ICopyButtonProps): ReactElement => {
  const { text, options, ...rest } = props;
  const { hasCopied, onCopy, setValue } = useClipboard(text, options);

  useEffect(() => {
    setValue(text);
  }, [setValue, text]);

  return hasCopied ? (
    <IconButton variant="link" icon={<CheckIcon />} aria-label="copied" color="green.400" {...rest} />
  ) : (
    <IconButton icon={<CopyIcon />} variant="link" aria-label="copy" onClick={onCopy} {...rest} />
  );
};
