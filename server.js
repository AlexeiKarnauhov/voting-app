const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ✅ Глобальные переменные
let correctAnswer = 'Сбер';         // Один на всех — меняется через /reset
let votes = [];
let firstCorrectUser = null;

// Раздача статики
app.use(express.static(path.join(__dirname, '/')));

// Подключения клиентов
io.on('connection', (socket) => {
  console.log('Клиент подключён');
  let userName = null;

  socket.on('register', (name) => {
    userName = name;
    console.log(`Пользователь: ${userName}`);
  });

  socket.on('vote', (answer) => {
    console.log(`Голос от ${userName}: ${answer}`);
    
    const isCorrect = answer === correctAnswer;
    votes.push({ name: userName, answer, time: Date.now() });

    if (isCorrect && !firstCorrectUser) {
      firstCorrectUser = userName;
    }

    // Отправляем результат клиенту
    socket.emit('vote_result', {
      correctAnswer,
      yourAnswer: answer,
      isCorrect,
      firstCorrectUser
    });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён');
  });
});

// ✅ Сброс раунда и установка нового правильного ответа
app.get('/reset', (req, res) => {
  votes = [];
  firstCorrectUser = null;

  if (req.query.answer) {
    correctAnswer = req.query.answer;
    console.log('✅ Установлен новый правильный ответ:', correctAnswer);
  }  

  res.send({ status: 'ok' });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`✅ Сервер работает: http://localhost:${PORT}`);
});
