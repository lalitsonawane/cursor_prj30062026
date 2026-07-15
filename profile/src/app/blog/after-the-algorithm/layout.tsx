import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "After the Algorithm: Redesigning Economics for a Post-AGI World",
  description:
    "When cognitive labor becomes abundant, the wage-for-goods equation collapses. Explore four emerging economic models for a post-AGI future: compute standards, verification economies, redistribution, and authenticity premiums.",
  keywords: [
    "AGI",
    "economics",
    "post-AGI",
    "universal basic income",
    "resource-based economy",
    "artificial general intelligence",
  ],
  openGraph: {
    title: "After the Algorithm: Redesigning Economics for a Post-AGI World",
    description:
      "Four economic models emerging for a world where the cost of intelligence drops to zero.",
    type: "article",
  },
};

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
