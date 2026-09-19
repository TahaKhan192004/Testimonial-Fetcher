export function testimonialText(r: {
  q5_experience_text: string;
  name: string;
  business_name: string;
  testimonial_permission: string;
}): string | null {
  if (r.testimonial_permission === "no") return null;
  const quote = `“${r.q5_experience_text.trim()}”`;
  if (r.testimonial_permission === "named") return `${quote}\n${r.name}, ${r.business_name}`;
  return `${quote}\nAI Employee Challenge participant`;
}
