import { makeCollectionRoutes } from "@/lib/collection-handlers";
import { jobDescriptionsDir } from "@/lib/paths";

export const { GET, POST } = makeCollectionRoutes(jobDescriptionsDir);
