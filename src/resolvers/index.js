import Resolver from "@forge/resolver";
import api, { storage, route } from "@forge/api";

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

// Fetch templates for the user
resolver.define("getTemplates", async (req) => {
  const { email } = req.payload;

  if (!email || typeof email !== "string") {
    console.error("Invalid email payload:", email);
    throw new Error("Email is required and must be a valid string.");
  }

  // Generate a valid key for Forge storage
  const sanitizedEmail = email.trim().replace(/[^a-zA-Z0-9:._\s-#]/g, "#"); // Replace invalid characters
  const key = `${sanitizedEmail}_templates`;

  console.log("Generated storage key:", key);

  try {
    // Fetch templates from storage
    const templates = await storage.get(key);
    console.log("Templates:", templates)
    return templates || [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw new Error("Failed to retrieve templates from storage.");
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

resolver.define("setTemplates", async (req) => {
  try {
    // Log the entire incoming payload for debugging
    console.log("Received Payload:", req.payload);

    const { email, templates } = req.payload;

    // Validate email field
    if (!email || typeof email !== "string") {
      console.error("Invalid email provided:", email);
      throw new Error("Email is required and must be a valid string.");
    }

    // Sanitize email
    const sanitizedEmail = email.trim().replace(/[^a-zA-Z0-9:._\s-#]/g, "#");

    // Debug logs for sanity checking
    console.log("Sanitized Email Key:", sanitizedEmail);
    console.log("Templates to Save:", templates);

    // Save the templates to storage
    const key = `${sanitizedEmail}_templates`;
    await storage.set(key, templates);

    // Confirm success
    console.log("Templates Saved Successfully!");
    return { success: true };

  } catch (error) {
    // Log and re-throw the error
    console.error("Error saving templates:", error);
    throw new Error("Failed to save templates.");
  }
});


resolver.define("getMyself", async () => {
  try {
    const response = await api.asUser().requestJira(route`/rest/api/3/myself`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch user data: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Failed to fetch user data.");
  }
});

export const handler = resolver.getDefinitions();
