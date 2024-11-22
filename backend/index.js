// Write basic express boilerplate code
// with express.json() middleware

const express = require("express");
const { createTodo, updateTodo } = require("./types");
const { todo } = require("./db");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

app.post("/todo", async function (req, res) {
  const createPayload = req.body;
  const parsedPayload = createTodo.safeParse(createPayload);

  if (!parsedPayload.success) {
    res.status(411).json({
      msg: "You sent the wrong inputs",
    });
    return;
  }

  // put in mongodb
  await todo.create({
    id: createPayload.id,
    title: createPayload.title,
    description: createPayload.description,
    completed: false,
  });

  res.json({
    msg: "Todo Created",
  });
});

app.get("/todos", async function (req, res) {
  const todos = await todo.find();
  console.log(todos);
  res.json({
    todos,
  });
});

app.put("/completed", async function (req, res) {
  const updatePayLoad = req.body;
  const parsedPayLoad = updateTodo.safeParse(updatePayLoad);

  if (!parsedPayLoad.success) {
    res.status(411).json({
      msg: "You sent the wrong inputs",
    });
    return;
  }

  await todo.update(
    {
      _id: req.body.id,
    },
    {
      completed: true,
    }
  );

  res.json({
    msg: "Todo marked as completed",
  });
});
app.get("/todo", async (req, res) => {
  const { id } = req.query;

  try {
    const todoItem = await todo.findOne({ id: id });

    if (!todoItem) {
      return res.status(404).json({ msg: "Todo not found" });
    }

    return res.status(200).json({ todo: todoItem });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "An error occurred while fetching the todo." });
  }
});

app.listen(3000);
