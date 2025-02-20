import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface InviteEmailProps {
  inviteUrl: string
}

export const InviteEmail = ({ inviteUrl }: InviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        You're off the waitlist - welcome to 21st.dev's Magic beta! 🎉
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://21st.dev/magic-agent-og-image.png"
            width={580}
            height={300}
            alt="Magic Agent"
            style={{
              ...image,
              display: "block",
              margin: "0 auto 24px",
            }}
          />
          <Section style={section}>
            <Heading
              style={{
                ...h1,
                padding: "0",
              }}
            >
              Welcome to the future of UI development! ✨
            </Heading>
            <Text style={text}>
              Your time on the waitlist is over - get ready to experience the
              magic of AI-powered UI development! 🪄
            </Text>
            <Text style={text}>
              You are invited to be an early user of 21st.dev's Magic Agent
              beta. Our product is early, and we're excited to have you help
              shape its future. Every piece of feedback will make Magic better
              for everyone.
            </Text>
            <Button style={button} href={inviteUrl}>
              Join the Magic ✨
            </Button>
            <Text style={text}>
              We can't wait to see what you'll build with Magic! 🚀
            </Text>
            <Text style={footer}>
              Best wishes,
              <br />
              Serafim
              <br />
              <span style={subtitle}>Co-founder of 21st.dev</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "0 0 48px",
  maxWidth: "580px",
}

const image = {
  borderRadius: "8px",
  marginBottom: "24px",
  width: "100%",
  height: "auto",
}

const section = {
  padding: "32px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
}

const h1 = {
  color: "#111827",
  fontSize: "28px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 24px",
}

const text = {
  color: "#6b7280",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px",
}

const button = {
  backgroundColor: "#000000",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "32px 0",
  border: "1px solid rgba(0,0,0,0.1)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
}

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "32px 0 0",
  lineHeight: "1.6",
}

const subtitle = {
  color: "#6b7280",
  fontSize: "13px",
  fontStyle: "italic",
}

export default InviteEmail
