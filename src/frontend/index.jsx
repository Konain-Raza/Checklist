import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Inline,
  TextArea,
  Button,
  Checkbox,
  SectionMessage,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalTransition,
  Text,
  Select,
  Lozenge,
  List,
  ListItem,
  Box,
  ProgressBar,
  xcss,
  Heading,
  Strike,
  Modal,
} from "@forge/react";
import { view, invoke } from "@forge/bridge";
import { Label } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';

const Checklist = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [issueKey, setIssueKey] = useState("");
  const [inputStatus, setInputStatus] = useState("To Do");
  const [textInput, setTextInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState(null);

  const contentStyles = xcss({
    padding: "space.200",
    backgroundColor: "#f4f5f7",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const context = await view.getContext();
        const currentIssueKey = context.extension.issue.id;
        if (!currentIssueKey) throw new Error("Issue key not found.");
        setIssueKey(currentIssueKey);

        const [storedTasks, userData] = await Promise.all([
          invoke("getTasks", { issueKey: currentIssueKey }),
          invoke("getMyself"),
        ]);

        setTasks(storedTasks || []);
        if (!userData?.emailAddress) throw new Error("User email not found.");

        const allTemplates = await invoke("getTemplates", {
          email: userData.emailAddress,
        });

        setTemplates(Array.isArray(allTemplates) ? allTemplates : []);
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddTask = async (template) => {
    if (!template?.items?.length) {
      setMessage({ type: "warning", text: "No tasks in this template." });
      return;
    }

    setIsAddingTask(true);

    try {
      const newTasks = template.items.map((item, i) => ({
        text: item.text || `Task ${i + 1}`,
        status: inputStatus,
        checked: false,
      }));
      const updatedTasks = [...newTasks, ...tasks];
      setTasks(updatedTasks);
      await invoke("setTasks", { issueKey, tasks: updatedTasks });
      setMessage({ type: "success", text: `Tasks added.` });
      setModalMessage({ type: "success", text: `Tasks added.` });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add tasks." });
    } finally {
      setIsAddingTask(false);
      setInputStatus("To Do");
      setTextInput("");
    }
  };

  const handleStatusChange = async (index, status) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, status, checked: status === "Done" } : task
    );
    setTasks(updatedTasks);

    try {
      await invoke("setTasks", { issueKey, tasks: updatedTasks });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update status." });
    }
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsViewModalOpen(true);
  };
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const totalTasks = tasks.filter((task) => task.status !== "Done").length;
  const progressValue = totalTasks > 0 ? completedTasks / totalTasks : 0;

  return (
    <Box>
      {message && (
        <SectionMessage appearance={message.type}>
          <Text>{message.text}</Text>
        </SectionMessage>
      )}

      {isLoading ? (
        <SectionMessage appearance="information">
          <Text>Loading tasks...</Text>
        </SectionMessage>
      ) : (
        <>
          <Inline spread="space-between" alignBlock="center">
            <Box>

              <Text>
                Completed {completedTasks} of {totalTasks} tasks
              </Text>
              <ProgressBar
                ariaLabel={`Done: ${completedTasks} of ${totalTasks} tasks`}
                value={progressValue}
                appearance={
                  completedTasks === totalTasks ? "success" : "default"
                }
              />
            </Box>
            <Button appearance="primary" onClick={() => setIsModalOpen(true)}>
              Open Templates
            </Button>
          </Inline>
          <Label htmlFor="basic-textfield">Field label</Label>
			<Textfield name="basic" id="basic-textfield" />

          {isModalOpen && (
            <ModalTransition>
              <Modal onClose={() => setIsModalOpen(false)} xcss={contentStyles}>
                <ModalHeader>
                  <ModalTitle>
                    <Heading as="h1">Templates</Heading>
                  </ModalTitle>
                  {modalMessage && (
                    <SectionMessage appearance={modalMessage.type}>
                      <Text>{modalMessage.text}</Text>
                    </SectionMessage>
                  )}
                </ModalHeader>
                <ModalBody>
                  <List type="unordered">
                    {templates.map((template) => (
                      <ListItem key={template.name}>
                        <Inline space="space.100" spread="space-between">
                          <Text>
                            {template.name.length > 60
                              ? template.name.slice(0, 50) + "..."
                              : template.name}
                          </Text>
                          <Inline space="space.100">
                            <Button
                              appearance="warning"
                              onClick={() => handleViewTemplate(template)}
                            >
                              View
                            </Button>
                            <Button
                              appearance="primary"
                              onClick={() => handleAddTask(template)}
                            >
                              Add
                            </Button>
                          </Inline>
                        </Inline>
                      </ListItem>
                    ))}
                  </List>
                </ModalBody>
                <ModalFooter>
                  <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                </ModalFooter>
              </Modal>
            </ModalTransition>
          )}

          {isViewModalOpen && selectedTemplate && (
            <ModalTransition>
              <Modal
                onClose={() => setIsViewModalOpen(false)}
                xcss={contentStyles}
              >
                <ModalHeader>
                  <ModalTitle>
                    <Heading as="h1">{selectedTemplate.name}</Heading>
                  </ModalTitle>
                </ModalHeader>
                <ModalBody>
                  <List type="unordered">
                    {selectedTemplate.items.map((item, index) => (
                      <ListItem key={index}>{item.text}</ListItem>
                    ))}
                  </List>
                </ModalBody>
                <ModalFooter>
                  <Button onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                </ModalFooter>
              </Modal>
            </ModalTransition>
          )}

          <Box
            xcss={{
              paddingBlock: "space.100",
            }}
          >
            <Inline alignBlock="center" space="space.050">
              <Select
                onChange={(e) => setInputStatus(e.value)}
                options={[
                  { label: "To do", value: "To Do" },
                  { label: "In Progress", value: "In Progress" },
                  { label: "Done", value: "Done" },
                  { label: "Skipped", value: "Skipped" },
                ]}
              />

              <TextArea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter a task"
              />
              <Button
                onClick={() =>
                  handleAddTask({
                    items: [{ text: textInput }],
                    name: "Custom",
                  })
                }
                appearance="primary"
                isDisabled={isAddingTask || !textInput}
              >
                {isAddingTask ? "Adding..." : "Add"}
              </Button>
            </Inline>
          </Box>

          {tasks.map((task, index) => {
            const boxStyles = xcss({
              backgroundColor:
                task.status === "Done"
                  ? "color.background.success"
                  : task.status === "In Progress"
                  ? "color.background.warning"
                  : task.status === "Skipped"
                  ? "color.background.danger.hovered"
                  : "color.background.accent.blue.subtlest",
              padding: "space.100",
            });

            return (
              <Box key={task.text + index} xcss={boxStyles}>
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
                    xcss={boxStyles}
                    defaultValue={task.status}
                    value={{ label: task.status, value: task.status }}
                    inputId={`task-status-select-${index}`}
                    onChange={(e) => handleStatusChange(index, e.value)}
                    options={[
                      { label: "To do", value: "To Do" },
                      { label: "In Progress", value: "In Progress" },
                      { label: "Done", value: "Done" },
                      { label: "Skipped", value: "Skipped" },
                    ]}
                  />
                  <Heading as="h5">
                    {task.status === "Done" ? (
                      <Strike>
                        {task?.text?.length > 30
                          ? task.text.slice(0, 30) + "..."
                          : task.text}
                      </Strike>
                    ) : task?.text?.length > 30 ? (
                      task.text.slice(0, 30) + "..."
                    ) : (
                      task.text
                    )}
                  </Heading>
                </Inline>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Checklist />
  </React.StrictMode>
);
