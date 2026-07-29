import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "FIRE Restaurant — Management System",
  description: "Complete restaurant POS and management system.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
