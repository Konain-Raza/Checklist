import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Inline,
  Button,
  Box,
  Heading,
  Textfield,
  Label,
  Text,
  List,
  Icon,
  SectionMessage,
  Spinner,
  ListItem,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalTransition,
  xcss,
} from "@forge/react";
import { invoke } from "@forge/bridge";

const App = () => {
  const [templates, setTemplates] = useState([]);
  const [email, setEmail] = useState("");
  const [newList, setNewList] = useState({ name: "", items: [] });
  const [newListName, setNewListName] = useState("");
  const [newListItems, setNewListItems] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await invoke("getMyself");
        if (userData?.emailAddress) {
          setEmail(userData.emailAddress);
          const allTemplates = await invoke("getTemplates", {
            email: userData.emailAddress,
          });
          if (Array.isArray(allTemplates)) {
            setTemplates(allTemplates);
          } else {
            throw new Error("Invalid templates data.");
          }
        } else {
          throw new Error("User email address not found.");
        }
      } catch (error) {
        setMessage("Error loading templates.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!newListName.trim() || newList.items.length === 0) {
      setMessage("Please enter a list name and items.");
      return;
    }

    const updatedList = { name: newListName.trim(), items: [...newList.items] };
    const allTemplates = [...templates, updatedList];
    setTemplates(allTemplates);
    handleClear();

    try {
      const response = await invoke("setTemplates", {
        email: email.trim(),
        templates: allTemplates,
      });
      setMessage(
        response?.success
          ? "List saved successfully."
          : "Failed to save the list."
      );
    } catch {
      setMessage("Error saving the list.");
    }
  };

  const handleClear = () => {
    setNewListName("");
    setNewListItems("");
    setNewList({ name: "", items: [] });
  };

  const addListItems = () => {
    if (!newListItems.trim()) {
      setMessage("Please enter an item.");
      return;
    }
    setNewList((prevList) => ({
      ...prevList,
      name: newListName.trim(),
      items: [
        ...prevList.items,
        { text: newListItems.trim(), status: "To Do", checked: false },
      ],
    }));
    setNewListItems("");
  };

  const createNewListBlock = xcss({
    backgroundColor: "color.background.neutral.subtle.hovered",
    padding: "space.200",
    width: "600px",
  });

  const ListBlockStyles = xcss({
    backgroundColor: "color.background.neutral.subtle.hovered",
    padding: "space.200",
  });

  const handleDeleteList = async (index) => {
    const updatedTemplates = templates.filter((_, i) => i !== index);
    setTemplates(updatedTemplates);

    try {
      const response = await invoke("setTemplates", {
        email: email.trim(),
        templates: updatedTemplates,
      });
      setMessage(
        response?.success
          ? "List deleted successfully."
          : "Failed to delete the list."
      );
    } catch {
      setMessage("Error deleting the list.");
    }
  };

  return (
    <>
      <Box paddingBlockEnd="space.200">
        <Heading as="h1">Create a New List</Heading>
      </Box>
      {message && (
        <SectionMessage appearance="information">
          <Text>{message}</Text>
        </SectionMessage>
      )}
      <Inline space="space.300">
        <Box xcss={createNewListBlock}>
          <Label>List Name</Label>
          <Textfield
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Enter list name"
          />

          <Label>List Item</Label>
          <Inline alignBlock="center" alignInline="center" space="space.200">
            <Textfield
              value={newListItems}
              onChange={(e) => setNewListItems(e.target.value)}
              placeholder="Enter list item"
            />
            <Button appearance="primary" onClick={addListItems}>
              +
            </Button>
          </Inline>

          {newList.items.length > 0 && (
            <>
              <List>
                <Heading as="h4">List Name: {newListName}</Heading>
                <Heading as="h4">List Items</Heading>

                {newList.items.map((item, index) => (
                  <ListItem key={index}>{item.text}</ListItem>
                ))}
              </List>
            </>
          )}
          <Box paddingBlockStart="space.200">
            <Inline alignBlock="center" alignInline="end" space="space.100">
              <Button appearance="primary" onClick={handleSave}>
                Save
              </Button>
              <Button iconAfter="eye" onClick={handleClear}>
                Clear
              </Button>
            </Inline>
          </Box>
        </Box>

        <Box paddingBlock="space.200" xcss={ListBlockStyles}>
          <Heading as="h1">My Lists</Heading>
          {loading ? (
            <Box padding="space.200">
              <Spinner size="large" />
            </Box>
          ) : templates.length > 0 ? (
            templates.map((template, index) => (
              <Box key={index} padding="space.100">
                <Inline space="space.400" spread="space-between">
                  <Inline
                    alignBlock="center"
                    alignInline="center"
                    space="space.200"
                  >
                    <Heading as="h4">{index + 1}</Heading>
                    <Heading as="h4">
                      {template.name.length > 90
                        ? template.name.slice(0, 80) + "..."
                        : template.name}
                    </Heading>
                  </Inline>
                  <Inline space="space.100">
                    {" "}
                    <Button
                      appearance="warning"
                      onClick={() => setActiveModal(template.name)}
                    >
                      View
                    </Button>
                    <Button
                      appearance="danger"
                      onClick={() => handleDeleteList(index)}
                    >
                      Delete
                    </Button>
                  </Inline>
                  <ModalTransition>
                    {activeModal === template.name && (
                      <Modal onClose={() => setActiveModal(null)}>
                        <ModalHeader>
                          <ModalTitle>{template.name}</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                          <List>
                            {template.items.map((item, index) => (
                              <ListItem key={index}>{item.text}</ListItem>
                            ))}
                          </List>
                        </ModalBody>
                        <ModalFooter>
                          <Button onClick={() => setActiveModal(null)}>
                            Close
                          </Button>
                        </ModalFooter>
                      </Modal>
                    )}
                  </ModalTransition>
                </Inline>
              </Box>
            ))
          ) : (
            <Box>
              <Heading as="h3">No templates found</Heading>
            </Box>
          )}
        </Box>
      </Inline>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
