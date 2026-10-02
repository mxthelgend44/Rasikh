"use client";

import { useEffect, useRef } from "react";
import { useNewcomer } from "@/store/person";

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Every person has a link of their own: `/newcomer?as=anders` (first name) or `?as=hire_seed_04`
 * (id). Opening it pins this browser tab to that person, and the choice survives moving between
 * the four phone pages. Without `as` the phone follows the story (see defaultHire).
 */
export function PersonLink() {
  const { hires, choose } = useNewcomer();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("as");
    if (!wanted || applied.current === wanted || hires.length === 0) return;
    const key = slug(wanted);
    const match =
      hires.find((hire) => slug(hire.id) === key) ??
      hires.find((hire) => slug(hire.fullName.split(" ")[0] ?? "") === key);
    if (match) {
      applied.current = wanted;
      choose(match.id);
    }
  }, [hires, choose]);

  return null;
}
