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
  Link,
} from "@react-email/components"
import * as React from "react"

interface Component {
  id: string
  name: string
  description: string
  username: string
  component_slug: string
  preview_url: string
  demo_slug: string
  demo_preview_url: string
  is_paid: boolean
  is_current_week: boolean
}

interface WeeklyDigestEmailProps {
  components: Component[]
}

// Function to strip URLs from text while preserving the text content
const stripUrls = (text: string) => {
  // Replace markdown links [text](url) with just text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  // Replace plain URLs with empty string
  text = text.replace(/https?:\/\/[^\s]+/g, "")
  return text.trim()
}

export const WeeklyDigestEmail = ({ components }: WeeklyDigestEmailProps) => {
  const currentWeekComponents = components.filter((c) => c.is_current_week)
  const lastWeekComponents = components.filter((c) => !c.is_current_week)
  const showLastWeek =
    currentWeekComponents.length < 5 && lastWeekComponents.length > 0

  return (
    <Html>
      <Head />
      <Preview>🎨 This week's top UI components from 21st.dev</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={{ ...text, fontSize: "18px", marginBottom: "16px" }}>
            👋 Hey there,
          </Text>

          <Text style={{ ...text, marginBottom: "24px" }}>
            Hope you're having a great week! Before diving into this week's
            component highlights, I wanted to mention we've just launched Magic
            MCP - our new design tool that lets you create components right in
            your IDE. Check it out if you're looking to speed up your workflow!
          </Text>

          <Link
            href="https://21st.dev/magic"
            style={{ ...viewButton, marginBottom: "24px" }}
          >
            Check out Magic MCP
          </Link>

          <Heading style={h1}>This Week's Top UI Components 🚀</Heading>

          <Text style={text}>
            Here are the most popular and innovative UI components from this
            week:
          </Text>

          {currentWeekComponents.map((component) => (
            <Section key={component.id} style={componentSection}>
              {(component.demo_preview_url || component.preview_url) && (
                <Img
                  src={component.demo_preview_url || component.preview_url}
                  width={500}
                  height={300}
                  alt={component.name}
                  style={componentImage}
                />
              )}
              <div style={componentHeader}>
                <Heading
                  style={{
                    ...h2,
                    marginBottom: "0",
                  }}
                >
                  {component.name}
                </Heading>
                {component.is_paid && <span style={proBadge}>PRO</span>}
              </div>
              <Text style={text}>{stripUrls(component.description)}</Text>
              <Text style={authorText}>By @{component.username}</Text>
              <Link
                style={viewButton}
                href={`https://21st.dev/${component.username}/${component.component_slug}/${component.demo_slug || "default"}`}
              >
                View component
              </Link>
            </Section>
          ))}

          {showLastWeek && (
            <>
              <Heading style={h1}>
                From Last Week You Might Have Missed 💫
              </Heading>
              {lastWeekComponents.map((component) => (
                <Section key={component.id} style={componentSection}>
                  {(component.demo_preview_url || component.preview_url) && (
                    <Img
                      src={component.demo_preview_url || component.preview_url}
                      width={500}
                      height={300}
                      alt={component.name}
                      style={componentImage}
                    />
                  )}
                  <div style={componentHeader}>
                    <Heading style={h2}>{component.name}</Heading>
                    {component.is_paid && <span style={proBadge}>PRO</span>}
                  </div>
                  <Text style={text}>{stripUrls(component.description)}</Text>
                  <Text style={authorText}>By @{component.username}</Text>
                  <Link
                    style={viewButton}
                    href={`https://21st.dev/${component.username}/${component.component_slug}/${component.demo_slug || "default"}`}
                  >
                    View component
                  </Link>
                </Section>
              ))}
            </>
          )}

          <Section style={proSection}>
            <div
              style={{
                display: "flex" as const,
                alignItems: "center" as const,
                gap: "16px",
              }}
            >
              <div style={{ flex: "1" }}>
                <Heading
                  style={{ ...h2, color: "#ffffff", marginBottom: "8px" }}
                >
                  Support us with Pro
                </Heading>
                <Text style={{ ...proText, margin: "0" }}>
                  Get access to premium components and Magic MCP to save hours
                  each week. Join our community of UI vibe coders!
                </Text>
                <Link
                  href="https://21st.dev/pricing"
                  style={{ ...proButton, margin: "16px 0 0" }}
                >
                  Join Pro
                </Link>
              </div>
            </div>
          </Section>

          <Text style={footer}>
            Want to create your own components? Visit{" "}
            <Link href="https://21st.dev" style={link}>
              21st.dev
            </Link>
            <br />
            <br />
            Until next week,
            <br />
            Serafim
            <br />
            <span style={subtitle}>Co-founder of 21st.dev</span>
          </Text>
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
  padding: "20px 24px 48px",
  maxWidth: "680px",
}

const componentSection = {
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
}

const proSection = {
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "#18181b",
  borderRadius: "12px",
}

const proText = {
  color: "#ffffff",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px",
}

const buttonGroup = {
  display: "block",
  margin: "0 -6px",
}

const proButton = {
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "8px 16px",
  lineHeight: "120%",
  margin: "0 0 8px",
}

const h1 = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 16px",
}

const componentHeader = {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: "8px",
  marginBottom: "12px",
}

const h2 = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0",
}

const proBadge = {
  display: "inline-block",
  padding: "4px 4px 0px 4px",
  backgroundColor: "#dbeafe",
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "500",
  borderRadius: "4px",
  lineHeight: "16px",
  height: "20px",
  marginLeft: "8px",
}

const text = {
  color: "#6b7280",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 6px",
}

const authorText = {
  color: "#4b5563",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0 0 12px",
}

const componentImage = {
  width: "100%",
  height: "auto",
  borderRadius: "6px",
  marginBottom: "12px",
  border: "1px solid #e5e7eb",
}

const viewButton = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#fafafa",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "8px 12px",
  lineHeight: "120%",
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

const link = {
  color: "#000000",
  textDecoration: "underline",
}

export default WeeklyDigestEmail
