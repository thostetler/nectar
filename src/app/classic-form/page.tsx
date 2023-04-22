'use client';
import { Heading, Stack } from '@chakra-ui/react';
import NextLink from 'next/link';

const Page = () => {
  return (
    <Stack>
      <Heading>Classic Form</Heading>
      <NextLink href={'/'}>/</NextLink>
    </Stack>
  );
};

export default Page;
