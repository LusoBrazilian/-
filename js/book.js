// ============================================================
// Two-page spread controller. DIALOGUE_PAGES (from content.js)
// holds all 11 leaves; they're paired into spreads the way a
// real bound book falls open: page 1 alone (facing a blank
// verso), then consecutive pairs (2,3) (4,5) ... (10,11).
// ============================================================
(function () {
  const SPREADS = (() => {
    const spreads = [{ left: null, right: 0 }];
    for (let index = 1; index < DIALOGUE_PAGES.length; index += 2) {
      spreads.push({
        left: index,
        right: index + 1 < DIALOGUE_PAGES.length ? index + 1 : null,
      });
    }
    return spreads;
  })();

  const coverWrap = document.getElementById('coverWrap');
  const bookWrap = document.getElementById('bookWrap');
  const btnBegin = document.getElementById('btnBegin');
  const btnCover = document.getElementById('btnCover');

  const slotLeft = document.getElementById('slotLeft');
  const slotRight = document.getElementById('slotRight');
  const flipRight = document.getElementById('flipRight');
  const flipRightFront = document.getElementById('flipRightFront');
  const flipRightBack = document.getElementById('flipRightBack');
  const flipLeft = document.getElementById('flipLeft');
  const flipLeftFront = document.getElementById('flipLeftFront');
  const flipLeftBack = document.getElementById('flipLeftBack');

  const zonePrev = document.getElementById('zonePrev');
  const zoneNext = document.getElementById('zoneNext');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const countEl = document.getElementById('pageCount');
  const spreadEl = document.getElementById('spread');

  let current = 0;      // index into SPREADS
  let animating = false;
  let showingCover = true;

  function pageMarkup(pageIndex) {
    if (pageIndex === null || pageIndex === undefined) {
      return '<div class="blank-leaf"><span class="blank-leaf__mark">Ζ</span></div>';
    }
    const p = DIALOGUE_PAGES[pageIndex];
    const meander = '<div class="meander-strip meander-strip--clay" aria-hidden="true"></div>';
    return `${meander}<div class="leaf__body">${p.body}</div>${meander}`;
  }

  function setSlot(el, pageIndex) {
    el.innerHTML = pageMarkup(pageIndex);
    el.scrollTop = 0;
  }

  function pageLabel(pageIndex) {
    return pageIndex === null || pageIndex === undefined ? '' : `p.${pageIndex + 1}`;
  }

  function updateControls() {
    const s = SPREADS[current];
    const parts = [pageLabel(s.left), pageLabel(s.right)].filter(Boolean);
    countEl.textContent = parts.length ? parts.join(' \u2013 ') + ` of ${DIALOGUE_PAGES.length}` : '';
    btnPrev.disabled = false; // prev always available (returns to cover at spread 0)
    btnNext.disabled = current === SPREADS.length - 1;
    zonePrev.toggleAttribute('disabled', false);
    zoneNext.toggleAttribute('disabled', current === SPREADS.length - 1);
  }

  function showCover() {
    showingCover = true;
    coverWrap.classList.remove('is-hidden');
    bookWrap.classList.add('is-hidden');
  }

  function showBook() {
    showingCover = false;
    coverWrap.classList.add('is-hidden');
    bookWrap.classList.remove('is-hidden');
    setSlot(slotLeft, SPREADS[current].left);
    setSlot(slotRight, SPREADS[current].right);
    updateControls();
  }

  function turn(targetIndex, direction) {
    if (animating) return;
    animating = true;

    const from = SPREADS[current];
    const to = SPREADS[targetIndex];

    if (direction === 'next') {
      // Underlying slots already show the destination spread.
      setSlot(slotLeft, to.left);
      setSlot(slotRight, to.right);

      flipRightFront.innerHTML = pageMarkup(from.right);
      flipRightBack.innerHTML = pageMarkup(to.left);

      flipRight.style.transition = 'none';
      flipRight.style.transform = 'rotateY(0deg)';
      flipRight.classList.add('is-active');
      void flipRight.offsetWidth;
      flipRight.style.transition = '';
      flipRight.classList.add('is-turning');
      requestAnimationFrame(() => {
        flipRight.style.transform = 'rotateY(-180deg)';
      });

      finishAfter(flipRight, () => {
        flipRight.classList.remove('is-active', 'is-turning');
        current = targetIndex;
        updateControls();
        animating = false;
      });
    } else {
      setSlot(slotLeft, to.left);
      setSlot(slotRight, to.right);

      flipLeftFront.innerHTML = pageMarkup(from.left);
      flipLeftBack.innerHTML = pageMarkup(to.right);

      flipLeft.style.transition = 'none';
      flipLeft.style.transform = 'rotateY(0deg)';
      flipLeft.classList.add('is-active');
      void flipLeft.offsetWidth;
      flipLeft.style.transition = '';
      flipLeft.classList.add('is-turning');
      requestAnimationFrame(() => {
        flipLeft.style.transform = 'rotateY(180deg)';
      });

      finishAfter(flipLeft, () => {
        flipLeft.classList.remove('is-active', 'is-turning');
        current = targetIndex;
        updateControls();
        animating = false;
      });
    }
  }

  function finishAfter(el, callback) {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      el.removeEventListener('transitionend', onEvt);
      callback();
    };
    const onEvt = (e) => {
      if (e.target !== el || e.propertyName !== 'transform') return;
      done();
    };
    el.addEventListener('transitionend', onEvt);
    const dur = parseFloat(getComputedStyle(el).transitionDuration) * 1000 || 750;
    setTimeout(done, dur + 80);
  }

  function next() {
    if (showingCover) {
      showBook();
      return;
    }
    if (animating || current >= SPREADS.length - 1) return;
    turn(current + 1, 'next');
  }

  function prev() {
    if (showingCover) return;
    if (animating) return;
    if (current === 0) {
      showCover();
      return;
    }
    turn(current - 1, 'prev');
  }

  btnBegin.addEventListener('click', next);
  btnCover.addEventListener('click', () => { if (!animating) showCover(); });
  zoneNext.addEventListener('click', next);
  zonePrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  });

  // Initial paint (cover is visible by default in the markup).
  updateControls();
})();
