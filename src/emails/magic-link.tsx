import { APP_NAME } from "@/lib/constants";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "react-email";

export function MagicLinkEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to {APP_NAME}</Preview>
      <Body>
        <Container>
          <Heading>Sign in to {APP_NAME}</Heading>
          <Section>
            <Text>Click the button below to sign in. This link expires in 10 minutes.</Text>
            <Button href={url}>Sign in</Button>
            <Text>Or copy this link: {url}</Text>
            <Text>If you didn&apos;t request this, you can safely ignore this email.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
