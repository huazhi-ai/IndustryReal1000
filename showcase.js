(() => {
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = $('hero-carousel'), video = $('hero-pipeline');
  const slides = [...hero.querySelectorAll('.hero-slide')];
  const tabs = [...hero.querySelectorAll('[data-slide]')];
  let current = 0, rotating = !reduced.matches, visible = true, timer;
  function schedule() {
    clearTimeout(timer);
    $('hero-toggle').textContent = rotating ? '暂停轮播' : '继续轮播';
    $('hero-toggle').setAttribute('aria-pressed', String(!rotating));
    if (!rotating || !visible || document.hidden) { video.pause(); return; }
    if (current === 0) timer = setTimeout(() => show(1), 9000);
    else video.play().catch(() => { rotating = false; schedule(); });
  }
  function show(index, manual = false) {
    video.pause();
    current = (index + slides.length) % slides.length;
    if (manual) rotating = false;
    slides.forEach((slide,i) => { slide.hidden = i !== current; });
    tabs.forEach((tab,i) => tab.setAttribute('aria-pressed', String(i === current)));
    if (current === 1) video.currentTime = 0;
    schedule();
    if (manual && current === 1) video.play().catch(() => {});
  }
  tabs.forEach(tab => tab.addEventListener('click',() => show(Number(tab.dataset.slide),true)));
  $('hero-prev').addEventListener('click',() => show(current-1,true));
  $('hero-next').addEventListener('click',() => show(current+1,true));
  $('hero-toggle').addEventListener('click',() => { rotating = !rotating; schedule(); });
  video.addEventListener('ended',() => { if (rotating) show(0); });
  video.addEventListener('error',() => { rotating=false; show(0); });
  new IntersectionObserver(entries => { visible=entries[0].isIntersecting; schedule(); },{threshold:.1}).observe(hero);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',() => { if(reduced.matches) { rotating=false; schedule(); } });
  schedule();

  let samplesPlaying = !reduced.matches, samplesVisible = false;
  const sampleImages = [...document.querySelectorAll('.sample-media img')];
  const dialog=$('sample-dialog'), dialogImage=$('sample-dialog-image');
  function updateSamples(){
    $('sample-toggle').textContent=samplesPlaying?'暂停动图':'播放动图';
    $('sample-toggle').setAttribute('aria-pressed',String(!samplesPlaying));
    sampleImages.forEach(img=>{
      const src=samplesPlaying && samplesVisible && !document.hidden && !dialog.open?img.dataset.animated:img.dataset.still;
      if(img.getAttribute('src')!==src) img.src=src;
    });
    if(dialog.open){
      const src=samplesPlaying && !document.hidden?dialogImage.dataset.animated:dialogImage.dataset.still;
      if(dialogImage.getAttribute('src')!==src) dialogImage.src=src;
      $('dialog-toggle').textContent=samplesPlaying?'暂停动图':'播放动图';
    }
  }
  $('sample-toggle').addEventListener('click',()=>{samplesPlaying=!samplesPlaying;updateSamples();});
  $('dialog-toggle').addEventListener('click',()=>{samplesPlaying=!samplesPlaying;updateSamples();});
  document.querySelectorAll('.sample-media').forEach(button=>button.addEventListener('click',()=>{
    const img=button.querySelector('img');
    $('sample-dialog-title').textContent=img.alt;
    dialogImage.alt=img.alt;
    dialogImage.dataset.animated=img.dataset.animated;
    dialogImage.dataset.still=img.dataset.still;
    dialog.showModal();updateSamples();
  }));
  $('dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{dialogImage.removeAttribute('src');updateSamples();});
  new IntersectionObserver(entries=>{samplesVisible=entries[0].isIntersecting;updateSamples();},{rootMargin:'100px'}).observe($('dynamic-samples'));
  document.addEventListener('visibilitychange',updateSamples);
  reduced.addEventListener('change',()=>{if(reduced.matches){samplesPlaying=false;updateSamples();}});
  updateSamples();
})();
