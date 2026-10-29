import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Designer from "@/components/Designer";

export const metadata: Metadata = { title: "Studio — Mappy" };

export default function StudioPage() {
  return (
    <>
      <Nav />
      <Designer mode="consumer" />
    </>
  );
}
