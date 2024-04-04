import { Card, CardBody, Center, Container, Heading } from '@chakra-ui/react';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { getServerSession } from 'next-auth';
import { authOptions } from '@pages/api/auth/[...nextauth]';

export default function WelcomePage() {
  return (
    <>
      <Head>
        <title>NASA Science Explorer - Welcome</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading as="h2" id="form-label" alignSelf="center" my="6">
          Welcome
        </Heading>

        <Center>
          <Card>
            <CardBody>
              <p>Welcome to NASA Science Explorer! Your account was created!</p>
              <p>Please check your email to complete the registration process.</p>
            </CardBody>
          </Card>
        </Center>
      </Container>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (session) {
    return { redirect: { destination: '/', permanentRedirect: false } };
  }

  return {
    props: {},
  };
}
