import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Stack,
} from '@chakra-ui/react';
import { EyeIcon, EyeOffIcon } from '@heroicons/react/solid';
import { useSession } from '@hooks/useSession';
import { NextPage } from 'next';
import Head from 'next/head';
import { ChangeEvent, FormEventHandler, useState } from 'react';

const Login: NextPage<{ csrf: string }> = ({}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useSession();

  const update =
    <T extends (v: string) => void>(cb: T) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      cb(e.currentTarget.value);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    login({ email, password })
      .then((result) => {
        console.log('result', result);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Login</title>
      </Head>

      <Flex flexDirection="column" width="100wh" height="100vh" justifyContent="center" alignItems="center">
        <Stack flexDir="column" mb="2" justifyContent="center" alignItems="center">
          <Avatar bg="teal.500" />
          <Heading color="teal.400">Welcome</Heading>
          <Box minW={{ base: '90%', md: '468px' }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4} p="1rem" backgroundColor="whiteAlpha.900" boxShadow="md">
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email address"
                    name="email"
                    value={email}
                    onChange={update(setEmail)}
                  />
                </FormControl>
                <FormControl>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      name="password"
                      value={password}
                      onChange={update(setPassword)}
                    />
                    <InputRightElement width="4.5rem">
                      <IconButton
                        aria-hidden
                        icon={showPassword ? <EyeIcon /> : <EyeOffIcon />}
                        aria-label={showPassword ? 'hide password' : 'show password'}
                        h="1.75rem"
                        size="xs"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormHelperText textAlign="right">
                    <Link>forgot password?</Link>
                  </FormHelperText>
                </FormControl>
                <Button borderRadius={0} type="submit" variant="solid" width="full">
                  Login
                </Button>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Flex>
    </div>
  );
};

export default Login;

// import api, { ApiTargets, ICSRFResponse } from '@api';
// import { defaultRequestConfig } from '@api/config';
// import { getCSRF } from '@utils';
// import { GetServerSideProps } from 'next';
// import { useQuery } from 'react-query';

// export const getServerSideProps: GetServerSideProps = async ({ req }) => {
//   try {
//     const csrf = await getCSRF(req);
//     return {
//       props: {
//         csrf,
//       },
//     };
//   } catch (e) {
//     console.log(e);
//     return { props: { csrf: '' } };
//   }
// };
