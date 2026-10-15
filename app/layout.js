import "./globals.css";

export const metadata = {
  title: "AI Studio — Image & Video Generator",
  description: "Describe it, generate it. Real AI image and video, powered by Replicate.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
