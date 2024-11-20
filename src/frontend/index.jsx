import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Inline,
  Textfield,
  Button,
  Checkbox,
  LoadingButton,
  Strike,
  Popup,
  SectionMessage,
  Text,
  Select,
  List,
  ListItem,
  Fragment,
  Box,
  xcss,
  Tooltip,
  Heading,
} from "@forge/react";
import { view, invoke } from "@forge/bridge";

const Checklist = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [issueKey, setIssueKey] = useState("");
  const [inputStatus, setInputStatus] = useState("To Do");
  const [textInput, setTextInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const contentStyles = xcss({
    padding: "space.200",
  });

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

  const handleAddTask = async (template) => {
    if (template && template.stages) {
      setIsAddingTask(true);

      const newTasks = template.stages.map((stage) => ({
        text: `${template.name} - ${stage}`, // Corrected template literal
        status: inputStatus,
        checked: false,
      }));

      const updatedTasks = [...newTasks, ...tasks];
      setTasks(updatedTasks);
      setTextInput("");

      try {
        await invoke("setTasks", { issueKey, tasks: updatedTasks });
        setMessage({
          type: "success",
          text: `${template.name} tasks added successfully`, // Fixed closing string
        });
      } catch {
        setMessage({ type: "error", text: "Failed to add tasks" });
      } finally {
        setIsAddingTask(false);
        setInputStatus("To Do");
      }
    }
  };

  const templates = [
    {
      name: "Dev",
      stages: [
        "Planning",
        "Development",
        "Testing",
        "Review",
        "Deployment",
        "Maintenance",
      ],
    },
    {
      name: "UAT",
      stages: ["Planning", "Testing", "Sign-off"],
    },
    {
      name: "Software Development",
      stages: [
        "Requirements",
        "Design",
        "Implementation",
        "Testing",
        "Deployment",
        "Maintenance",
      ],
    },
    {
      name: "QA",
      stages: ["Test Planning", "Test Execution", "Bug Fixing", "Reporting"],
    },
    {
      name: "Prod",
      stages: ["Preparation", "Deployment", "Monitoring", "Post-Deployment"],
    },
    {
      name: "Staging",
      stages: ["Setup", "Pre-Testing", "Testing", "Verification"],
    },
  ];

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
          <Popup
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            placement="top-start"
            content={() => (
              <Box xcss={contentStyles}>
                <Heading as="h5">Task List</Heading>
                <List type="ordered">
                  {templates.map((template) => (
                    <ListItem key={template.name}>
                      <Inline space="space.400" spread="space-between">
                        <Text>{template.name}</Text>
                        <Inline space="space.200">
                          <Button
                            appearance="primary"
                            onClick={() => handleAddTask(template)}
                          >
                            Add
                          </Button>
                          <Button
                            appearance="warning"
                            onClick={() => {
                              console.log(`Viewing tasks for ${template.name}`);
                            }}
                          >
                            View
                          </Button>
                        </Inline>
                      </Inline>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            trigger={() => (
              <Button
                appearance="primary"
                isSelected={isOpen}
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? "Close" : "Open"} popup
              </Button>
            )}
          />

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
                onClick={() =>
                  handleAddTask({ stages: [textInput], name: "Custom" })
                }
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
    <Checklist />
  </React.StrictMode>
);
