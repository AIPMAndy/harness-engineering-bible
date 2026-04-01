/**
 * Legacy Node.js Server - 混乱的旧代码示例
 * 不要在生产环境使用！
 */

const express = require('express');
const mysql = require('mysql');

const app = express();
const PORT = 3000;

// 全局变量
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp'
};

let connection = mysql.createConnection(DB_CONFIG);

// 中间件
app.use(express.json());

// API 路由 - 重复代码严重

app.get('/api/users', (req, res) => {
  let users = [];
  connection.query('SELECT * FROM users', (err, result) => {
    if (err) {
      res.send('Error');
    } else {
      res.json(result);
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  let id = req.params.id;
  connection.query('SELECT * FROM users WHERE id=' + id, (err, result) => {
    if (err) {
      res.send('Error');
    } else {
      res.json(result[0]);
    }
  });
});

app.post('/api/users', (req, res) => {
  let { username, email, password } = req.body;
  
  // 重复的验证逻辑
  if (username.length < 3) {
    res.status(400).send('Username too short');
    return;
  }
  if (password.length < 6) {
    res.status(400).send('Password too short');
    return;
  }
  if (email.indexOf('@') === -1) {
    res.status(400).send('Invalid email');
    return;
  }
  
  // SQL 注入漏洞！
  connection.query(
    "INSERT INTO users (username, email, password) VALUES('" +
    username + "', '" + email + "', '" + password + "')",
    (err, result) => {
      if (err) {
        res.send('Error');
      } else {
        res.json({ id: result.insertId });
      }
    }
  );
});

app.put('/api/users/:id', (req, res) => {
  let id = req.params.id;
  let { username, email } = req.body;
  
  // 重复的验证逻辑
  if (username && username.length < 3) {
    res.status(400).send('Username too short');
    return;
  }
  
  connection.query(
    "UPDATE users SET username='" + username + "', email='" + email + 
    "' WHERE id=" + id,
    (err, result) => {
      if (err) {
        res.send('Error');
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.delete('/api/users/:id', (req, res) => {
  let id = req.params.id;
  connection.query("DELETE FROM users WHERE id=" + id, (err, result) => {
    if (err) {
      res.send('Error');
    } else {
      res.json({ success: true });
    }
  });
});

// 重复的工具函数
function validateEmail(email) {
  return email.indexOf('@') !== -1;
}

function validateUsername(username) {
  return username.length >= 3;
}

function validatePassword(password) {
  return password.length >= 6;
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connection.connect();
});
