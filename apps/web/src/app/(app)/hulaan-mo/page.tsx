import type { Metadata } from "next";
import { HulaanApp } from "@/components/hulaan-mo/HulaanApp";

export const metadata: Metadata = {
  title: "Hulaan Mo",
  description: "A guessing game for a group on one phone, based on Pinoy Henyo.",
};

export default function HulaanMoPage() {
  return <HulaanApp />;
}
