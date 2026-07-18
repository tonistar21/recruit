/**
 * АСУ "Рекрут+" - Модуль малювання тактичних графіків (HTML5 Canvas)
 */

const Charts = {
  // Допоміжна функція для масштабування під Retina дисплеї
  setupCanvas: (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  },

  /**
   * Графік №1: Динаміка реєстрацій (Гістограма / Bar Chart) за останні 7 днів
   */
  initRegisterDynamics: (canvasId, rawData) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Скидаємо/очищаємо при повторному рендерингу
    const setup = Charts.setupCanvas(canvas);
    const ctx = setup.ctx;
    const width = setup.width;
    const height = setup.height;

    // Дефолтні дані, якщо реальні порожні
    const data = rawData || [
      { label: 'Пн', value: 12 },
      { label: 'Вт', value: 20 },
      { label: 'Ср', value: 15 },
      { label: 'Чт', value: 24 },
      { label: 'Пт', value: 30 },
      { label: 'Сб', value: 10 },
      { label: 'Нд', value: 6 }
    ];

    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Максимальне значення
    const vals = data.map(d => d.value);
    const maxVal = Math.max(...vals, 10);
    const stepCount = 4;
    const roundedMax = Math.ceil(maxVal / stepCount) * stepCount;

    // Малювання горизонтальної сітки
    ctx.strokeStyle = '#283039';
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8b95a5';
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let i = 0; i <= stepCount; i++) {
      const yVal = (roundedMax / stepCount) * i;
      const y = paddingTop + chartHeight - (yVal / roundedMax) * chartHeight;
      
      // Засічки і сітка
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Текстові підписи зліва
      ctx.fillText(yVal, paddingLeft - 8, y);
    }

    // Малювання стовпців
    const colCount = data.length;
    const colWidth = (chartWidth / colCount) * 0.55;
    const colGap = (chartWidth / colCount) * 0.45;

    data.forEach((item, index) => {
      const x = paddingLeft + (index * (colWidth + colGap)) + colGap / 2;
      const colHeight = (item.value / roundedMax) * chartHeight;
      const y = paddingTop + chartHeight - colHeight;

      // Стовпець градієнтом
      // Основний військовий зелений з переходом у світліший
      const grad = ctx.createLinearGradient(x, y, x, paddingTop + chartHeight);
      grad.addColorStop(0, '#10b981'); // Акцентний зелений вгорі
      grad.addColorStop(1, '#1b2d20'); // Темний військовий зелений внизу

      // Стовпець із закругленими кутами
      const radius = 6;
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (colHeight > 0) {
        ctx.moveTo(x, y + colHeight);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.arcTo(x + colWidth, y, x + colWidth, y + radius, radius);
        ctx.lineTo(x + colWidth, y + colHeight);
        ctx.closePath();
        ctx.fill();
        
        // Тонка засічка верхівки
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + colWidth, y);
        ctx.stroke();
      }

      // Значення над стовпцем
      ctx.fillStyle = '#f3f4f6';
      ctx.textAlign = 'center';
      ctx.font = '11px "JetBrains Mono", monospace';
      if (item.value > 0) {
        ctx.fillText(item.value, x + colWidth / 2, y - 8);
      }

      // Текст осі X
      ctx.fillStyle = '#8b95a5';
      ctx.fillText(item.label, x + colWidth / 2, paddingTop + chartHeight + 16);
    });
  },

  /**
   * Графік №2: Розподіл за статусами (Діаграма-пончик / Donut Chart)
   */
  initStatusDonut: (canvasId, rawData) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const setup = Charts.setupCanvas(canvas);
    const ctx = setup.ctx;
    const width = setup.width;
    const height = setup.height;

    // Дані за замовчуванням
    const data = rawData || [
      { label: 'Новий', value: 10, color: '#3b82f6' },
      { label: 'Співбесіда', value: 15, color: '#f97316' },
      { label: 'Перевірка док.', value: 8, color: '#eab308' },
      { label: 'Тестування', value: 12, color: '#a855f7' },
      { label: 'Рекомендовано', value: 25, color: '#10b981' },
      { label: 'Відхилено', value: 5, color: '#ef4444' }
    ];

    const total = data.reduce((sum, d) => sum + d.value, 0);

    const centerX = width * 0.35;
    const centerY = height * 0.5;
    const outerRadius = Math.min(width, height) * 0.35;
    const innerRadius = outerRadius * 0.72;

    let startAngle = -Math.PI / 2;

    data.forEach((slice) => {
      const sliceAngle = (slice.value / total) * 2 * Math.PI;

      // Малюємо сектор кільця
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle, false);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      
      ctx.fillStyle = slice.color;
      ctx.fill();

      // Тонкі розділювачі секторів
      ctx.strokeStyle = '#181c20';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Малювання центу пончика (темна серцевина)
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#181c20';
    ctx.fill();

    // Загальна кількість по центру
    ctx.fillStyle = '#f3f4f6';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, centerX, centerY - 6);

    ctx.fillStyle = '#8b95a5';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText('КАНДИДАТІВ', centerX, centerY + 12);

    // Малювання легенди справа від пончика
    const legendX = width * 0.68;
    const startLegendY = centerY - (data.length * 18) / 2;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    data.forEach((slice, index) => {
      const y = startLegendY + index * 18;

      // Кільце/маркер кольору
      ctx.beginPath();
      ctx.arc(legendX, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = slice.color;
      ctx.fill();

      // Текст назви статусу
      ctx.fillStyle = '#f3f4f6';
      ctx.font = '11px sans-serif';
      ctx.fillText(slice.label, legendX + 12, y);

      // Кількість / відсоток
      const percent = Math.round((slice.value / total) * 100);
      ctx.fillStyle = '#8b95a5';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`${slice.value} (${percent}%)`, legendX + 130, y);
    });
  },

  /**
   * Графік №3: Динаміка залучення та зарахування (Лінійний графік з градієнтною заливкою / Area Chart)
   */
  initAreaDynamics: (canvasId, rawData) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const setup = Charts.setupCanvas(canvas);
    const ctx = setup.ctx;
    const width = setup.width;
    const height = setup.height;

    const labels = ['Тиж 01', 'Тиж 02', 'Тиж 03', 'Тиж 04', 'Тиж 05', 'Тиж 06', 'Тиж 07', 'Тиж 08'];
    const dataEnroll = rawData && rawData.enroll ? rawData.enroll : [180, 120, 480, 850, 400, 410, 490, 310];
    const dataApplied = rawData && rawData.applied ? rawData.applied : [350, 290, 220, 600, 310, 340, 410, 280];

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Максимальне значення
    const maxVal = Math.max(...dataEnroll, ...dataApplied, 1000);
    const stepCount = 5;
    const roundedMax = Math.ceil(maxVal / 200) * 200;

    // Горизонтальна сітка
    ctx.strokeStyle = '#283039';
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8b95a5';
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let i = 0; i <= stepCount; i++) {
      const yVal = (roundedMax / stepCount) * i;
      const y = paddingTop + chartHeight - (yVal / roundedMax) * chartHeight;
      
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(yVal, paddingLeft - 8, y);
    }

    // Малювання кривих ліній
    const drawCurve = (points, color, fillColor) => {
      ctx.beginPath();
      const calcX = (idx) => paddingLeft + (idx / (points.length - 1)) * chartWidth;
      const calcY = (val) => paddingTop + chartHeight - (val / roundedMax) * chartHeight;

      // Малюємо плавну бікубічну криву
      ctx.moveTo(calcX(0), calcY(points[0]));
      for (let i = 0; i < points.length - 1; i++) {
        const x1 = calcX(i);
        const y1 = calcY(points[i]);
        const x2 = calcX(i + 1);
        const y2 = calcY(points[i + 1]);
        const cpX1 = x1 + (x2 - x1) / 2;
        const cpY1 = y1;
        const cpX2 = x1 + (x2 - x1) / 2;
        const cpY2 = y2;
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x2, y2);
      }

      // Трасування лінії
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Шлях для красивого градієнту під лінією
      ctx.lineTo(calcX(points.length - 1), paddingTop + chartHeight);
      ctx.lineTo(calcX(0), paddingTop + chartHeight);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
      grad.addColorStop(0, fillColor);
      grad.addColorStop(1, 'rgba(23, 27, 31, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    // Малюємо першу криву (Нові анкети) - тьмяний сіро-зелений
    drawCurve(dataApplied, 'rgba(139, 149, 165, 0.4)', 'rgba(53, 75, 52, 0.15)');

    // Малюємо головну акцентну криву (Проходження / зарахування) - яскравий зелений
    drawCurve(dataEnroll, '#10b981', 'rgba(16, 185, 129, 0.25)');

    // Контрольні точки та мітки осі X
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8b95a5';
    labels.forEach((label, idx) => {
      const x = paddingLeft + (idx / (labels.length - 1)) * chartWidth;
      
      // Засічка осі X
      ctx.beginPath();
      ctx.moveTo(x, paddingTop + chartHeight);
      ctx.lineTo(x, paddingTop + chartHeight + 4);
      ctx.strokeStyle = '#283039';
      ctx.stroke();

      // Підпис
      ctx.fillText(label, x, paddingTop + chartHeight + 16);
    });

    // Легенда графіка
    const legendY = 12;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';

    // Перший маркер (Зараховані)
    ctx.beginPath();
    ctx.arc(width - 140, legendY, 5, 0, 2*Math.PI);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText('Зараховано / Рекоменд.', width - 150, legendY + 3);

    // Другий маркер (Зареєстровані)
    ctx.beginPath();
    ctx.arc(width - 20, legendY, 5, 0, 2*Math.PI);
    ctx.fillStyle = 'rgba(139, 149, 165, 0.6)';
    ctx.fill();
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText('Подано анкет', width - 30, legendY + 3);
  }
};

window.Charts = Charts;
