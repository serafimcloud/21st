import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
} from "@react-email/components"
import * as React from "react"
import { SubmissionStatus } from "@/components/features/admin/types"

interface SubmissionStatusEmailProps {
  componentName: string
  demoName?: string
  status: SubmissionStatus
  feedback?: string
  username: string
  componentUrl?: string
}

export const SubmissionStatusEmail = ({
  componentName,
  demoName,
  status,
  feedback,
  username,
  componentUrl,
}: SubmissionStatusEmailProps) => {
  const fullComponentName = demoName
    ? `${componentName}. Demo: ${demoName}`
    : componentName

  const getStatusData = () => {
    switch (status) {
      case "featured":
        return {
          title: "Your submission has been featured! 🌟",
          message: `Congratulations! Your component "${fullComponentName}" has been featured on 21st.dev. This means your work will be showcased to the entire community.`,
          buttonText: "View Your Featured Component",
          showShareButton: true,
        }
      case "posted":
        return {
          title: "Your submission has been approved",
          message: `Your component "${fullComponentName}" has been published and is available via direct link. However, it's not featured in our public listings yet as it doesn't fully meet our quality guidelines. If you'd like your component to be featured, please review our guidelines and make necessary improvements.`,
          buttonText: "View Your Component",
          showShareButton: false,
        }
      case "rejected":
        return {
          title: "Update on your submission",
          message: `We've reviewed your component "${fullComponentName}" and unfortunately, we cannot accept it in its current form. Please see the feedback below for more details.`,
          buttonText: "Submit a New Component",
          showShareButton: false,
        }
      default:
        return {
          title: "Update on your submission",
          message: `We have an update regarding your component "${fullComponentName}" on 21st.dev.`,
          buttonText: "Check Status",
          showShareButton: false,
        }
    }
  }

  const statusData = getStatusData()

  const createShareUrl = (url: string) => {
    const shareText = `Check out my component ${componentName} that was just featured on @21st_dev!`
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
  }

  return (
    <Html>
      <Head />
      <Preview>{statusData.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={h1}>{statusData.title}</Heading>
            <Text style={text}>Hello {username},</Text>
            <Text style={text}>{statusData.message}</Text>
            {feedback && (
              <>
                <Text style={feedbackTitle}>Feedback from our team:</Text>
                <Text style={feedbackText}>{feedback}</Text>
              </>
            )}

            {componentUrl && (
              <>
                <Button style={button} href={componentUrl}>
                  {statusData.buttonText}
                </Button>

                {statusData.showShareButton && (
                  <>
                    <Text style={shareText}>
                      Proud of your work? Share it with the community!
                    </Text>
                    <Button
                      style={twitterButton}
                      href={createShareUrl(componentUrl)}
                    >
                      Share on X
                    </Button>
                  </>
                )}
              </>
            )}

            <Text style={text}>
              Thank you for contributing to the 21st.dev community!
            </Text>
            <Text style={footer}>
              Best regards,
              <br />
              The 21st.dev Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "24px",
  maxWidth: "580px",
}

const section = {
  padding: "32px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
}

const h1 = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 24px",
}

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px",
}

const shareText = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "1.4",
  margin: "32px 0 12px",
  textAlign: "center" as const,
  fontWeight: "500",
}

const feedbackTitle = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 8px",
}

const feedbackText = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 20px",
  padding: "16px",
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  borderLeft: "4px solid #d1d5db",
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
  margin: "32px 0 0",
  border: "1px solid rgba(0,0,0,0.1)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
}

const twitterButton = {
  backgroundColor: "#1DA1F2",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "8px 0 32px",
  border: "1px solid rgba(29,161,242,0.1)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
}

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "32px 0 0",
  lineHeight: "1.6",
}

export default SubmissionStatusEmail
