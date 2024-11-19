import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Inline,
  Textfield,
  Button,
  Checkbox,
  LoadingButton,
  Strike,
  SectionMessage,
  Text,
  Select,
  Box,
  Heading,
} from "@forge/react";
import { view, invoke } from "@forge/bridge";

const App = () => {
  const [issueKey, setIssueKey] = useState("");
  const [inputStatus, setInputStatus] = useState("To Do");
  const [textInput, setTextInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const context = await view.getContext();
      const currentIssueKey = context.extension.issue.id;
      setIssueKey(currentIssueKey);

      if (currentIssueKey) {
        try {
          const storedTasks = await invoke("getTasks", {
            issueKey: currentIssueKey,
          });
          setTasks(storedTasks || []);
        } catch {
          setMessage({ type: "error", text: "Failed to fetch tasks" });
        } finally {
          setIsLoading(false);
        }
      }
    };
    initialize();
  }, []);

  const getTaskBackgroundColor = (status) => {
    switch (status) {
      case "In Progress":
        return "color.background.discovery"; // Assuming this is for "In Progress"
      case "Done":
        return "color.background.success"; // Example: Success color for Done
      case "Skipped":
        return "color.background.neutral"; // Example: Neutral color for Skipped
      default:
        return "color.background.default"; // Default color for To Do
    }
  };

  const handleAddTask = async () => {
    if (textInput) {
      setIsAddingTask(true);
      const newTask = { text: textInput, status: inputStatus, checked: false };
      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      setTextInput("");

      try {
        await invoke("setTasks", { issueKey, tasks: updatedTasks });
        setMessage({ type: "success", text: "Task added successfully" });
      } catch {
        setMessage({ type: "error", text: "Failed to add task" });
      } finally {
        setIsAddingTask(false);
      }
    }
  };

  const handleStatusChange = async (index, status) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, status, checked: status === "Done" } : task
    );

    setTasks(updatedTasks);

    try {
      await invoke("setTasks", { issueKey, tasks: updatedTasks });
    } catch {
      setMessage({ type: "error", text: "Failed to update task status" });
    }

    console.log(updatedTasks);
  };

  return (
    <>
      {message && (
        <SectionMessage appearance={message.type}>
          <Text>{message.text}</Text>
        </SectionMessage>
      )}

      {isLoading ? (
        <SectionMessage appearance="information">
          <Text>Loading tasks, please wait...</Text>
        </SectionMessage>
      ) : (
        <>
          <Inline space="space.050" alignBlock="center">
            <Select
              inputId="task-status-select"
              appearance="default"
              onChange={(e) => setInputStatus(e.value)}
              options={[
                { label: "To do", value: "To do" },
                { label: "In Progress", value: "In Progress" },
                { label: "Done", value: "Done" },
                { label: "Skipped", value: "Skipped" },
              ]}
            />
            <Textfield
              isRequired
              id="taskInput"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter a task"
            />
            {isAddingTask ? (
               <LoadingButton appearance="primary" isLoading>
               Loading button
             </LoadingButton>
            ) : (
              <Button
                onClick={handleAddTask}
                appearance="primary"
                isLoading={isAddingTask}
              >
                Add Task
              </Button>
            )}
          </Inline>

          {tasks.length > 0 &&
            tasks.map((task, index) => (
              <Box paddingBlockStart="space.200" key={task.text + index}>
                <Inline alignBlock="center" space="space.100">
                  <Checkbox
                    onChange={(e) =>
                      handleStatusChange(
                        index,
                        e.target.checked ? "Done" : "To Do"
                      )
                    }
                    isChecked={task.checked}
                  />
                  <Select
                    value={{ label: task.status, value: task.status }}
                    placeholder={task.status}
                    inputId={`task-status-select-${index}`}
                    appearance="default"
                    onChange={(e) => handleStatusChange(index, e.value)}
                    options={[
                      { label: "To do", value: "To do" },
                      { label: "In Progress", value: "In Progress" },
                      { label: "Done", value: "Done" },
                      { label: "Skipped", value: "Skipped" },
                    ]}
                  />
                  <Heading as="h5">
                    {task.status === "Done" ? (
                      <Strike>{task.text}</Strike>
                    ) : (
                      <Text>{task.text}</Text>
                    )}
                  </Heading>
                </Inline>
              </Box>
            ))}
        </>
      )}
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
