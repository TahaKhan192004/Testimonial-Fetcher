import type { Metadata } from "next";
import { ThankYou } from "./ThankYou";

export const metadata: Metadata = {
  title: "You are in | AI Savvy Founders",
  robots: { index: false },
};

export default function ThankYouPage() {
  return <ThankYou />;
}
