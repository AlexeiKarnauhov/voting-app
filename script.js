document.addEventListener('DOMContentLoaded', () => {
  let currentRound = 0;
  
  const answers = ['Бородко Олег', 'Савченко Андрей', 'Демиденко Елена', 'Михайлова Наталья', 'Подольский Дмитрий', 'Елисеев Евгений', 'Липатова Елена'];
  const rounds = answers.length;

  const startScreen = document.getElementById('start-screen');
  const app = document.getElementById('app');
  const voteSection = document.getElementById('vote-section');
  const resultSection = document.getElementById('result-section');
  const loadingScreen = document.getElementById('loading-screen');
  const voteOptions = document.getElementById('vote-options');
  const countdownElement = document.getElementById('countdown');
  const internalColumn = document.getElementById('internal-column');
  const externalColumn = document.getElementById('external-column');
  const columns = document.querySelectorAll('.column');

  const nameInput = document.getElementById('username');
  const userResults = [];

  const socket = io(); // подключаемся к серверу socket.io

  // Получаем имя пользователя из localStorage
  const storedName = localStorage.getItem('username');
  
  socket.on('vote_result', (data) => {
    console.log('Результат голосования от сервера:', data);
    const { correctAnswer, yourAnswer, isCorrect, firstCorrectUser } = data;

    console.log('firstCorrectUser from server:', firstCorrectUser);
    console.log('local username:', localStorage.getItem('username'));

    // Сохраняем результат для финального экрана
    userResults.push({
      round: currentRound + 1,
      yourAnswer,
      correctAnswer,
      isCorrect
    });
  
    // Показываем картинку
    const imageName = correctAnswer + '.jpg';
    //const backgroundImage = document.getElementById('backgroundImage');
    //backgroundImage.src = imageName;
    //backgroundImage.alt = correctAnswer;
    document.querySelector('.photo-container').classList.add('visible');
  
    // Отображаем результат
    document.getElementById('result-message').innerHTML = `
      Правильный ответ: ${correctAnswer}.<br>
      Ваш выбор: ${yourAnswer || 'нет ответа'}.<br>
      ${isCorrect ? '✅ Вы ответили верно!' : '❌ Неверный ответ.'}<br>
      ${firstCorrectUser ? `👑 Первый правильно ответивший: ${firstCorrectUser}` : ''}
    `;

    document.getElementById('restart-button').classList.remove('hidden');

    resultSection.classList.remove('hidden');

    // Всплывающее уведомление, если пользователь был первым правильно ответившим
    if (firstCorrectUser === localStorage.getItem('username')) {
      const popup = document.createElement('div');
      popup.textContent = '🎉 Вы первый правильно ответивший!';
      popup.style.position = 'fixed';
      popup.style.top = '20px';
      popup.style.left = '50%';
      popup.style.transform = 'translateX(-50%)';
      popup.style.background = 'green';
      popup.style.color = 'white';
      popup.style.padding = '12px 20px';
      popup.style.borderRadius = '8px';
      popup.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
      popup.style.zIndex = '1000';
      document.body.appendChild(popup);

      setTimeout(() => {
        popup.remove();
      }, 3000);
    }

    // Обработка нажатия "Обновить профиль"
    const restartBtn = document.getElementById('restart-button');
    restartBtn.onclick = () => {
      resultSection.classList.add('hidden');
      document.querySelector('.photo-container').classList.remove('visible');
      //backgroundImage.src = '';
    
      loadingScreen.classList.remove('hidden');
      columns.forEach(el => el.classList.add('blur'));
    
      currentRound++;
    
      if (currentRound >= rounds) {
        showFinalResults();
        return;
      }
    
      setTimeout(() => {
        // reset вызывается после завершения всех изменений и перехода
        const nextCorrectAnswer = answers[currentRound % rounds];
        fetch(`/reset?answer=${encodeURIComponent(nextCorrectAnswer)}`);
    
        loadingScreen.classList.add('hidden');
        columns.forEach(el => el.classList.remove('blur'));
        loadData();
        setTimeout(displayVotingOptions, 2000);
      }, 5000);
    };    
  });  
  
  // Данные по раундам
  const internalRounds = [
    ['Клиентская активность', 'Сегментация', 'История операций', 'Вовлечённость', 'Обращения в поддержку'],
    ['Продуктовый портфель', 'Скоринг', 'Лояльность', 'Профиль потребления', 'История займов'],
    ['Финансовое поведение', 'Скорость отклика', 'Периодичность операций', 'Цели использования', 'Транзакционная нагрузка'],
    ['Время обращений', 'Реакции на офферы', 'Поведение в мобильном банке', 'История уведомлений', 'Изменения профиля']
  ];

  const externalRounds = [
    ['Открытые источники', 'Платёжные системы', 'Партнёры', 'Демография', 'Геолокация'],
    ['Социальные сети', 'Каталоги компаний', 'МФО и бюро кредитов', 'Данные с госпорталов', 'Транспортные платформы'],
    ['Торговые сети', 'Третьи лица', 'Данные страховых', 'Открытые API', 'Рекламные платформы'],
    ['Электронные чеки', 'Аналитические отчёты', 'Инфраструктурные партнёры', 'Мобильные приложения', 'Данные с устройств']
  ];

  // Начальное состояние элементов
  app.classList.add('hidden');
  voteSection.classList.add('hidden');
  resultSection.classList.add('hidden');
  loadingScreen.classList.add('hidden');
  columns.forEach(el => el.classList.remove('blur'));

  document.getElementById('start-button').onclick = () => {
    const username = nameInput.value.trim();
    if (!username) {
      alert('Пожалуйста, введите имя.');
      return;
    }
    localStorage.setItem('username', username);
    socket.emit('register', username);

    startScreen.style.display = 'none';
    app.classList.remove('hidden');
    columns.forEach(el => el.classList.remove('blur'));
    loadingScreen.classList.add('hidden');

    correctAnswer = answers[currentRound]; // СИНХРОНИЗАЦИЯ СЕРВЕРА
    fetch(`/reset?answer=${encodeURIComponent(correctAnswer)}`);

    loadData();
    setTimeout(displayVotingOptions, 2000);
  };

  function loadData() {
    const internalData = internalRounds[currentRound % internalRounds.length];
    const externalData = externalRounds[currentRound % externalRounds.length];

    internalColumn.innerHTML = `<h2>Внутренние данные</h2>` +
      internalData.map(text => `<div class=\"block\">${text}</div>`).join('');
    externalColumn.innerHTML = `<h2>Внешние данные</h2>` +
      externalData.map(text => `<div class=\"block\">${text}</div>`).join('');
  }

  function displayVotingOptions() {
    voteSection.classList.remove('hidden');
    voteOptions.innerHTML = '';
    answers.forEach(answer => {
      const btn = document.createElement('button');
      btn.classList.add('vote-button');
      btn.textContent = answer;
      btn.onclick = () => finishVoting(answer);
      voteOptions.appendChild(btn);
    });
    startCountdown(20);
  }

  let voteTimer = null; // глобально

  function startCountdown(seconds) {
    if (voteTimer) {
      clearInterval(voteTimer); // на всякий случай сброс
    }
  
    let timeLeft = seconds;
    countdownElement.textContent = timeLeft;
  
    voteTimer = setInterval(() => {
      timeLeft--;
      countdownElement.textContent = timeLeft;
  
      if (timeLeft <= 0) {
        clearInterval(voteTimer);
        voteTimer = null;
        finishVoting(null);
      }
    }, 1000);
  }

  function finishVoting(selectedAnswer) {
    if (voteTimer) {
      clearInterval(voteTimer);
      voteTimer = null;
    }
    voteSection.classList.add('hidden');
    const correctAnswer = answers[currentRound % answers.length];
    socket.emit('vote', selectedAnswer);
    const imageName = correctAnswer + '.jpg';
    const backgroundImage = document.getElementById('background-image');
    backgroundImage.src = imageName;
    backgroundImage.alt = correctAnswer;
    document.querySelector('.photo-container').classList.add('visible');


    resultSection.innerHTML = `<div id=\"result-message\">Правильный ответ: ${correctAnswer}. Ваш выбор: ${selectedAnswer || 'нет ответа'}.</div>`;
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Обновить профиль';
    restartBtn.id = 'restart-button';
    restartBtn.onclick = () => {
      resultSection.classList.add('hidden');
      document.querySelector('.photo-container').classList.remove('visible');
      backgroundImage.src = '';
    
      loadingScreen.classList.remove('hidden');
      columns.forEach(el => el.classList.add('blur'));
    
      // Правильный ответ следующего раунда (вычисляется ДО изменения currentRound)
      const nextCorrectAnswer = answers[(currentRound + 1) % rounds];
    
      setTimeout(() => {
        currentRound++;

        if (currentRound >= rounds) {
          showFinalResults();
          return;
        }

        // ⏱ Переносим reset строго после того, как завершили текущий раунд
        setTimeout(() => {
          const nextCorrectAnswer = answers[currentRound % rounds];
          fetch(`/reset?answer=${encodeURIComponent(nextCorrectAnswer)}`);
        }, 100); // очень короткая задержка, но гарантирует, что голос уже обработан

        loadingScreen.classList.add('hidden');
        columns.forEach(el => el.classList.remove('blur'));
        loadData();
        setTimeout(displayVotingOptions, 2000);

      }, 5000);
      
    };
    
    resultSection.appendChild(restartBtn);
    resultSection.classList.remove('hidden');
  }
  function showFinalResults() {
    app.classList.add('hidden');
  
    const final = document.createElement('div');
    final.id = 'final-screen';
    final.innerHTML = `<h2>Результаты голосования для ${localStorage.getItem('username')}</h2>`;
  
    const list = document.createElement('ul');
    userResults.forEach((res) => {
      const item = document.createElement('li');
      item.innerHTML = `Раунд ${res.round}: 
        Ваш ответ — <b>${res.yourAnswer || 'нет ответа'}</b>, 
        правильный — <b>${res.correctAnswer}</b> 
        ${res.isCorrect ? '✅' : '❌'}`;
      list.appendChild(item);
    });
  
    const thanks = document.createElement('p');
    thanks.textContent = 'Спасибо за участие! Ваш профиль успешно завершён.';
  
    final.appendChild(list);
    final.appendChild(thanks);
    document.body.appendChild(final);
  }  
});
