import { makeItemRoutes } from "@/lib/collection-handlers";
import { jobDescriptionsDir } from "@/lib/paths";

export const { GET, PUT, PATCH, DELETE } = makeItemRoutes(jobDescriptionsDir);
