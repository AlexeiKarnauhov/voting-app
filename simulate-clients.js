// Нагрузочное тестирование: симуляция 50 пользователей, подключающихся к серверу через socket.io

const io = require('socket.io-client');
const TOTAL_USERS = 1000;
const ROUNDS = 7;
const SERVER_URL = 'https://voting-app-s5dv.onrender.com';
const ANSWERS = [
  'Бородко Олег',
  'Савченко Андрей',
  'Демиденко Елена',
  'Михайлова Наталья',
  'Елисеев Евгений',
  'Подольский Дмитрий',
  'Липатова Елена'
];

for (let i = 0; i < TOTAL_USERS; i++) {
  const socket = io(SERVER_URL);
  const userName = `User-${i + 1}`;

  socket.on('connect', () => {
    socket.emit('register', userName);

    let round = 0;

    const voteInNextRound = () => {
      if (round >= ROUNDS) {
        socket.disconnect();
        return;
      }

      const delay = Math.floor(Math.random() * 4000) + 1000;
      setTimeout(() => {
        const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
        console.log(`${userName} (Раунд ${round + 1}) голосует за ${answer}`);
        socket.emit('vote', answer);
        round++;
        voteInNextRound();
      }, delay);
    };

    voteInNextRound();

    socket.on('vote_result', (data) => {
      console.log(`${userName}: результат — ${data.isCorrect ? '✅' : '❌'}${data.isFirstCorrect ? ' 👑' : ''}`);
    });
  });

  socket.on('connect_error', (err) => {
    console.error(`${userName} — ошибка подключения:`, err.message);
  });
}
