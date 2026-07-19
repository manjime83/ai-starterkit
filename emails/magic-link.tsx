import { APP_NAME } from "@/lib/constants";
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from "react-email";

export default function MagicLinkEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to {APP_NAME}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", maxWidth: "480px", padding: "24px" }}>
          <Heading as="h1" style={{ fontSize: "24px" }}>
            Sign in to {APP_NAME}
          </Heading>
          <Text>Click the button below to sign in. This link expires shortly.</Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={url}
              style={{
                backgroundColor: "#171717",
                borderRadius: "6px",
                color: "#ffffff",
                padding: "12px 20px",
              }}
            >
              Sign in
            </Button>
          </Section>
          <Text>Or copy and paste this URL into your browser:</Text>
          <Link href={url} style={{ wordBreak: "break-all" }}>
            {url}
          </Link>
          <Text style={{ color: "#737373", marginTop: "24px" }}>
            If you didn&apos;t request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

MagicLinkEmail.PreviewProps = { url: "http://localhost:3000/api/auth/magic-link/verify?token=preview" };
