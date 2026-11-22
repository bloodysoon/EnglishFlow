import { redirect } from "next/navigation";

// Learn is a sidebar group now; old /learn links (with filters) land on New words.
export default async function LearnPage({ searchParams }: PageProps<"/learn">) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const v of [value].flat()) if (v !== undefined) params.append(key, v);
  }
  const query = params.toString();
  redirect(query ? `/learn/new-words?${query}` : "/learn/new-words");
}
