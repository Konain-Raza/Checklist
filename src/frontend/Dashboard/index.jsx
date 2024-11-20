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
  SectionMessage,
  SectionMessageAction,
  ListItem,
  Popup,
} from "@forge/react";
import { invoke } from "@forge/bridge";

const App = () => {
  const [templates, setTemplates] = useState([]);
  const [email, setEmail] = useState("");
  const [newList, setNewList] = useState({ name: "", items: [] });
  const [newListName, setNewListName] = useState("");
  const [newListItems, setNewListItems] = useState("");
  const [message, setMessage] = useState("");
  const [openPopupIndex, setOpenPopupIndex] = useState(null); // Track the currently open popup index

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await invoke("getMyself");
        if (userData?.emailAddress) {
          setEmail(userData.emailAddress);
          const allTemplates = await invoke("getTemplates", {
            email: userData.emailAddress,
          });
          console.log(allTemplates);
          if (Array.isArray(allTemplates)) {
            setTemplates(allTemplates);
          } else {
            throw new Error("Invalid templates data.");
          }
        } else {
          throw new Error("User email address not found.");
        }
      } catch (error) {
        console.error(error);
        setMessage("Error loading templates.");
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!newListName || !newList.items.length) {
      setMessage("Please enter a list name and items.");
      return;
    }

    const updatedList = { name: newListName.trim(), items: [...newList.items] };
    const allTemplates = [...templates, updatedList];
    setTemplates(allTemplates);
    console.log(allTemplates);

    try {
      const response = await invoke("setTemplates", {
        email: email.trim(),
        templates: allTemplates,
      });
      if (response?.success) {
        setMessage("List saved successfully.");
      } else {
        setMessage("Failed to save the list.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error saving the list.");
    }
    handleClear();
  };

  const handleClear = () => {
    setNewListName("");
    setNewListItems("");
    setNewList({ name: "", items: [] });
    setMessage("List cleared.");
  };

  const addListItems = () => {
    if (!newListItems || newListItems.trim().length === 0) {
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

  const handleViewTasks = (templateName) => {
    console.log(`Viewing tasks for ${templateName}`);
    // Add your task viewing logic here
  };

  const togglePopup = (index) => {
    setOpenPopupIndex(openPopupIndex === index ? null : index); // Toggle the popup
  };

  return (
    <Box>
      <Heading as="h1">Create a New List</Heading>
      {message && (
        <SectionMessage appearance="information">
          <Text>{message}</Text>
        </SectionMessage>
      )}

      <Label>List Name</Label>
      <Textfield
        // value={newListName}
        onChange={(e) => setNewListName(e.target.value)}
        placeholder="Enter list name"
      />

      <Label>List Item</Label>
      <Inline alignBlock="center" alignInline="center" space="space.200">
        <Textfield
          // value={newListItems}
          onChange={(e) => setNewListItems(e.target.value)}
          placeholder="Enter list item"
        />
        <Button onClick={addListItems}>Add Item</Button>
      </Inline>

      {newList.items.length > 0 ? (
        <List>
          <Heading as="h3">List Items</Heading>
          {newList.items.map((item, index) => (
            <ListItem key={index}>{item.text}</ListItem>
          ))}
        </List>
      ) : (
        <Text>No items added yet.</Text>
      )}

      <Inline alignBlock="center" space="space.200">
        <Button appearance="primary" onClick={handleSave}>
          Save
        </Button>
        <Button appearance="secondary" onClick={handleClear}>
          Clear
        </Button>
      </Inline>

      <Box paddingBlock="space.200">
        <Heading as="h2">My Lists</Heading>
        {templates.map((template, index) => (
          <Box key={index} padding="space.100">
            <Inline space="space.400">
              <Text>{index + 1}</Text>
              <Heading as="h3">{template.name}</Heading>
              <Popup
                isOpen={openPopupIndex === index} // Only open the popup for the selected index
                onClose={() => setOpenPopupIndex(null)} // Close the popup when clicking outside
                placement="top-start"
                content={() => (
                  <Box>
                    <Heading as="h5">Task List</Heading>
                    <List type="ordered">
                      {template.items.map((item, i) => (
                        <ListItem key={i}>{item.text}</ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                trigger={() => (
                  <Button
                    appearance="primary"
                    onClick={() => togglePopup(index)} // Toggle the popup for this index
                  >
                    {openPopupIndex === index ? "Close" : "Open"} Tasks
                  </Button>
                )}
              />
            </Inline>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
