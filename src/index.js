const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if(!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if(userAlreadyExists) {
    return response.status(400).json({ error: 'User already exists' });
  }

  const newUser = { 
    id: uuidv4(), 
    name, 
    username, 
    todos: []
  };

  users.push(newUser);

  return response.status(201).send(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const { user } = request;

  const todo = { 
    id: uuidv4(),
    title,
    done: false, 
    deadline, 
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;

  const { user } = request;

  const todoToUpdate = user.todos.find((todo) => todo.id === id);

  if(!todoToUpdate) {
    return response.status(404).json({ error: 'ID does not exists in todo list!' });
  }

  const todoListToUpdate = user.todos.map(todo => {
    if(todo.id === id) {
      return {
        ...todo,
        title,
        deadline: new Date(deadline), 
      };
    }
    return todo;
  })
  
  user.todos = [...todoListToUpdate];
  
  todoToUpdate.title = title;
  todoToUpdate.deadline = new Date(deadline);
  
  return response.status(200).json(todoToUpdate);
  
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;

  const { user } = request;

  const todoToUpdate = user.todos.find((todo) => todo.id === id);

  if(!todoToUpdate) {
    return response.status(404).json({ error: 'ID does not exists in todo list!' });
  }

  const todoListToUpdate = user.todos.map(todo => {
    if(todo.id === id) {
      return {
        ...todo,
        done: true, 
      }
    }
    return todo;
  })

  todoToUpdate.done = true;

  user.todos = [...todoListToUpdate];

  return response.status(200).json(todoToUpdate);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;

  const { user } = request;

  const todo = user.todos.find(todo => todo.id === id);

  if(!todo) {
    return response.status(404).json({ error: 'ID does not exists in todo list!' });
  }

  user.todos.splice(todo);

  return response.status(204).send();
});

module.exports = app;