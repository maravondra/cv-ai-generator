import { makeCollectionRoutes } from "@/lib/collection-handlers";
import { knowledgeBaseDir } from "@/lib/paths";

export const { GET, POST } = makeCollectionRoutes(knowledgeBaseDir);
