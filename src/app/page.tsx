'use client';
import { Heading, Stack } from '@chakra-ui/react';
import NextLink from 'next/link';

const Page = () => {
  return (
    <Stack>
      <Heading>/</Heading>
      <NextLink href={'/classic-form'}>Classic Form</NextLink>
    </Stack>
  );
};

export default Page;
