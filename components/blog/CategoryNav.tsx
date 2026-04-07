import CategoryNavClient from "./CategoryNavClient";
import { getPublicCategories } from "@/lib/public-posts";

export default async function CategoryNav() {
  const categories = await getPublicCategories();

  if (categories.length === 0) {
    return null;
  }

  return <CategoryNavClient categories={categories} />;
}
