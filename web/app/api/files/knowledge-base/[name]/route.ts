import { makeItemRoutes } from "@/lib/collection-handlers";
import { knowledgeBaseDir } from "@/lib/paths";

export const { GET, PUT, PATCH, DELETE } = makeItemRoutes(knowledgeBaseDir);
