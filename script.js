/* =========================================
   1. РЕЖИМ СТРАНИЦЫ И МАСШТАБ ДЕСКТОПА
   ========================================= */

// То же условие, что используется в мобильных правилах CSS.
const mobileMode = window.matchMedia(
  '(max-width: 767px), (pointer: coarse)'
);

const portfolio = document.querySelector('.portfolio');

function updateDesktopScale() {
  if (!portfolio) return;

  const width = window.innerWidth;
  const shouldScale =
    !mobileMode.matches && width >= 768 && width < 950;

  portfolio.style.zoom = shouldScale
    ? String((width - 40) / 910)
    : '';
}


/* =========================================
   2. МОБИЛЬНЫЕ АККОРДЕОНЫ
   ========================================= */

const accordionCards = [
  ...document.querySelectorAll(
    '.about.flip-card, .projects > .flip-card'
  )
];

const accordions = accordionCards
  .map(card => {
    const toggle = card.querySelector(
      '.about-toggle, .project-mobile-toggle'
    );

    const details = card.classList.contains('about')
      ? card.querySelector('.about-back')
      : card.querySelector('.flip-inner');

    return { card, toggle, details };
  })
  .filter(item => item.toggle && item.details);


// Исходный порядок обложек — 3 × 2 для десктопа.

const studentGrid = document.querySelector(
  '.project-student .student-back'
);

const desktopCovers = studentGrid
  ? [...studentGrid.querySelectorAll('.student-cover')]
  : [];


// Мобильный порядок:
// Людмила, Ирина / Елена, Ольга / Наталья, Даша.

const mobileCovers = desktopCovers.length === 6
  ? [
      desktopCovers[0],
      desktopCovers[1],
      desktopCovers[5],
      desktopCovers[3],
      desktopCovers[4],
      desktopCovers[2]
    ]
  : desktopCovers;


function synchronizeViewMode() {
  const mobile = mobileMode.matches;

  accordions.forEach(({ card, toggle, details }) => {
    card.classList.remove('is-open', 'flip-reset');

    toggle.setAttribute('aria-expanded', 'false');

    details.inert = mobile;
  });

  // Перемещаем существующие ссылки,
  // сохраняя правильный порядок Tab.

  if (studentGrid && desktopCovers.length === 6) {
    studentGrid.append(...(mobile ? mobileCovers : desktopCovers));
  }

  updateDesktopScale();
}


// Раскрытие и сворачивание аккордеонов.

accordions.forEach(({ card, toggle, details }) => {
  toggle.addEventListener('click', () => {
    if (!mobileMode.matches) return;

    const isOpen = card.classList.toggle('is-open');

    toggle.setAttribute('aria-expanded', String(isOpen));

    details.inert = !isOpen;
  });
});


// Настройка при загрузке страницы.

synchronizeViewMode();


// Переключение режима при изменении экрана.

mobileMode.addEventListener('change', synchronizeViewMode);

window.addEventListener('resize', updateDesktopScale);


/* =========================================
   3. ПОПАПЫ ДЛЯ ПЛАКАТОВ И АФИШ
   ========================================= */

const lightbox = document.querySelector('.lightbox');

const lightboxImage = document.querySelector('.lightbox-image');

const lightboxClose = document.querySelector('.lightbox-close');

let lightboxTrigger = null;

if (lightbox && lightboxImage && lightboxClose) {

  document.querySelectorAll('a[data-lightbox]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();

      lightboxTrigger = link;

      link.closest('.flip-card')?.classList.add('flip-reset');

      lightboxImage.src = link.href;

      lightboxImage.alt =
        link.querySelector('img')?.alt || 'Изображение проекта';

      if (!lightbox.open) {
        lightbox.showModal();
      }
    });
  });


  // Закрытие крестиком.

  lightboxClose.addEventListener('click', () => {
    lightbox.close();
  });


  // Закрытие нажатием на фон.

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });


  // Очистка после закрытия.

  lightbox.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');

    lightboxTrigger?.blur();
    lightboxTrigger = null;
  });
}


/* =========================================
   4. ВОЗВРАТ КАРТОЧЕК ПОСЛЕ КЛИКА
   ========================================= */

document.querySelectorAll('.flip-card').forEach(card => {

  card.querySelectorAll(
    'a[href]:not([data-lightbox])'
  ).forEach(link => {

    link.addEventListener('click', () => {
      card.classList.add('flip-reset');
      link.blur();
    });

  });


  // Новый переворот разрешаем после
  // ухода курсора с карточки.

  card.addEventListener('pointerleave', () => {
    card.classList.remove('flip-reset');
  });

});


/* =========================================
   5. ОСЫПАНИЕ НАДПИСИ «ДИЗАЙНЕР»
   ========================================= */

const portraitCard = document.querySelector('.portrait-card');

const portraitSvg = document.querySelector('.portrait-label-svg');

const portraitBox = document.querySelector('.portrait-label-box');

const fragmentLayer = document.querySelector(
  '.portrait-label-fragments'
);


if (portraitCard && portraitSvg && portraitBox && fragmentLayer) {

  const sourceImage = new Image();

  sourceImage.crossOrigin = 'anonymous';
  sourceImage.src = portraitSvg.src;

  let lastWidth = 0;
  let renderVersion = 0;


  async function buildPortraitFragments() {

    const width = Math.round(portraitSvg.offsetWidth);

    if (!width || width === lastWidth) return;

    const version = ++renderVersion;

    try {
      await sourceImage.decode();

      if (version !== renderVersion) return;

      const height = Math.round(
        width * sourceImage.naturalHeight / sourceImage.naturalWidth
      );

      if (!height) return;


      // Невидимый canvas для анализа формы букв.

      const canvas = document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', {
        willReadFrequently: true
      });

      if (!ctx) return;

      ctx.drawImage(sourceImage, 0, 0, width, height);

      const pixels = ctx.getImageData(
        0,
        0,
        width,
        height
      ).data;

      const squares = document.createDocumentFragment();


      /* =========================================
         МАСШТАБИРОВАНИЕ КВАДРАТОВ

         SVG 280 px → квадраты 7 × 7 px
         SVG 116 px → квадраты 2.9 × 2.9 px
         ========================================= */

      const scale = width / 280;

      const size = 7 * scale;

      const columns = Math.ceil(width / size);
      const rows = Math.ceil(height / size);


      // Генерируем квадраты по форме SVG.

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {

          const x = col * size;
          const y = row * size;


          // Проверяем прозрачность в центре
          // клетки с учётом масштаба.

          const px = Math.min(
            Math.floor(x + size / 2),
            width - 1
          );

          const py = Math.min(
            Math.floor(y + size / 2),
            height - 1
          );

          const alpha = pixels[
            (py * width + px) * 4 + 3
          ];

          if (alpha < 128) continue;


          // Создаём квадрат.

          const square = document.createElement('span');

          square.className = 'portrait-label-fragment';

          square.style.left = `${x}px`;
          square.style.top = `${y}px`;

          square.style.width = `${size}px`;
          square.style.height = `${size}px`;


          // Боковой разлёт пропорционален
          // размеру надписи.

          square.style.setProperty(
            '--dx',
            `${(Math.random() - 0.5) * 36 * scale}px`
          );


          // Квадраты падают вниз за фотографией.

          square.style.setProperty(
            '--fall',
            `${
              portraitCard.clientHeight -
              portraitBox.offsetTop -
              y +
              10
            }px`
          );


          // Случайная задержка падения.

          square.style.setProperty(
            '--delay',
            `${Math.random() * 0.15}s`
          );

          squares.appendChild(square);
        }
      }


      // Заменяем предыдущие квадраты новыми.

      fragmentLayer.replaceChildren(squares);

      lastWidth = width;

    } catch (error) {
      console.warn(
        'Не удалось создать квадраты из SVG:',
        error
      );
    }
  }


  // Первоначальная генерация.

  buildPortraitFragments();


  // При изменении ширины SVG пересоздаём квадраты.

  if ('ResizeObserver' in window) {
    new ResizeObserver(
      buildPortraitFragments
    ).observe(portraitSvg);

  } else {
    window.addEventListener(
      'resize',
      buildPortraitFragments
    );
  }
}



/* =========================================
   6. АНИМАЦИЯ ФОТОГРАФИИ ПО ТАПУ
   ========================================= */

const mobilePortraitCard = document.querySelector(
  '.portrait-card'
);

const touchPortraitMode = window.matchMedia(
  '(hover: none), (pointer: coarse)'
);

const reducedPortraitMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
);

if (mobilePortraitCard) {

  document.addEventListener('click', event => {

    // На компьютере остаётся анимация по hover.
    if (!touchPortraitMode.matches) return;

    // Учитываем настройку уменьшения анимаций.
    if (reducedPortraitMotion.matches) return;

    const isPortraitTap = mobilePortraitCard.contains(
      event.target
    );

    const isAnimating = mobilePortraitCard.classList.contains(
      'portrait-tapped'
    );

    // Первый тап по фотографии — запускаем.
    if (isPortraitTap && !isAnimating) {

      mobilePortraitCard.classList.add(
        'portrait-tapped'
      );

    }

    // Любой следующий тап — останавливаем.
    else if (isAnimating) {

      mobilePortraitCard.classList.remove(
        'portrait-tapped'
      );

    }

  });

}


/* =========================================
   ПОДГОНКА ЗАГОЛОВКА В УЗКОМ ОКНЕ
   ========================================= */

const narrowDesktop = window.matchMedia(
  '(max-width: 767px) and (hover: hover) and (pointer: fine)'
);

const narrowHeading = document.querySelector('.hero h1');

function fitNarrowHeading() {
  if (!narrowHeading || !portfolio) return;

  // Убираем предыдущую подгонку.
  narrowHeading.style.fontSize = '';
  narrowHeading.style.transform = '';

  // На настоящем телефоне и широком десктопе
  // сохраняются обычные стили CSS.
  if (!narrowDesktop.matches) return;

  // Измеряем ширину текста без сжатия.
  narrowHeading.style.transform = 'scaleX(1)';

  const headingRect = narrowHeading.getBoundingClientRect();
  const portfolioRect = portfolio.getBoundingClientRect();

  const availableWidth =
    portfolioRect.right - headingRect.left;

  if (headingRect.width <= 0 || availableWidth <= 0) {
    return;
  }

  // Подгоняем надпись точно под доступную ширину.
  const scale = availableWidth / headingRect.width;

  narrowHeading.style.transform = `scaleX(${scale})`;
}

fitNarrowHeading();

window.addEventListener('resize', fitNarrowHeading);

narrowDesktop.addEventListener(
  'change',
  fitNarrowHeading
);

// Пересчитываем после загрузки шрифтов.
document.fonts.ready.then(fitNarrowHeading);