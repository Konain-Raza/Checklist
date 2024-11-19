import Resolver from "@forge/resolver";
import { storage } from "@forge/api";

const resolver = new Resolver();

// Fetch tasks for the issue
resolver.define("getTasks", async (req) => {
  const { issueKey } = req.payload;
  try {
    const tasks = await storage.get(`${issueKey}_tasks`);
    return tasks || [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw new Error("Failed to retrieve tasks.");
  }
});

// Save tasks for the issue
resolver.define("setTasks", async (req) => {
  const { issueKey, tasks } = req.payload;
  try {
    await storage.set(`${issueKey}_tasks`, tasks);
    return { success: true };
  } catch (error) {
    console.error("Error saving tasks:", error);
    throw new Error("Failed to save tasks.");
  }
});

export const handler = resolver.getDefinitions();
