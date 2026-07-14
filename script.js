(function(){
  "use strict";

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------- Custom cursor ---------------- */
  if(!isTouch){
    var cursor = document.querySelector('.cursor');
    var label = document.querySelector('.cursor-label');
    var mx = 0, my = 0, cx = 0, cy = 0;

    window.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
    });

    function raf(){
      cx += (mx - cx) * 0.22;
      cy += (my - cy) * 0.22;
      if(cursor) cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(raf);
    }
    raf();

    document.addEventListener('mouseover', function(e){
      var link = e.target.closest('a, button, .work-row');
      var media = e.target.closest('.case-media, .more-card');
      if(media){
        cursor.classList.add('is-media');
        cursor.classList.remove('is-link');
        if(label) label.textContent = 'View';
      } else if(link){
        cursor.classList.add('is-link');
        cursor.classList.remove('is-media');
      }
    });
    document.addEventListener('mouseout', function(e){
      var link = e.target.closest('a, button, .work-row');
      var media = e.target.closest('.case-media, .more-card');
      if(media && !e.relatedTarget) cursor.classList.remove('is-media');
      if(link && !e.relatedTarget) cursor.classList.remove('is-link');
      if(!e.relatedTarget || (!e.relatedTarget.closest('.case-media, .more-card'))) cursor.classList.remove('is-media');
      if(!e.relatedTarget || (!e.relatedTarget.closest('a, button, .work-row'))) cursor.classList.remove('is-link');
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-in'); });
  }
  // case-media images use the same [data-reveal] observer via CSS (.is-in), plus a dedicated
  // observer below so media not marked data-reveal-media individually still gets the curtain wipe
  var mediaEls = document.querySelectorAll('.case-media');
  if('IntersectionObserver' in window && !reduceMotion){
    var mio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('is-in'); mio.unobserve(entry.target); }
      });
    }, { threshold: 0.2 });
    mediaEls.forEach(function(el){ mio.observe(el); });
  } else {
    mediaEls.forEach(function(el){ el.classList.add('is-in'); });
  }

  /* ---------------- Preloader → hero reveal ---------------- */
  var preloader = document.querySelector('.preloader');
  var preloaderBar = document.querySelector('.preloader-bar i');
  var preloaderPct = document.querySelector('.preloader-pct');
  var heroName = document.getElementById('hero-name');
  var body = document.body;

  function revealHero(){
    if(heroName) heroName.classList.add('is-in');
    document.querySelectorAll('.hero [data-reveal]').forEach(function(el){ el.classList.add('is-in'); });
  }

  if(reduceMotion){
    if(preloader) preloader.classList.add('is-done');
    body.classList.remove('is-loading');
    revealHero();
  } else {
    var progress = 0;
    var target = 0;
    var imgs = Array.prototype.slice.call(document.images);
    var loaded = 0;
    var total = Math.max(imgs.length, 1);

    function bump(){
      loaded++;
      target = Math.min(99, Math.round((loaded / total) * 100));
    }
    imgs.forEach(function(img){
      if(img.complete){ bump(); }
      else{
        img.addEventListener('load', bump);
        img.addEventListener('error', bump);
      }
    });

    var startTime = performance.now();
    var minDuration = 1200;

    function tick(now){
      // ease progress toward target, but never finish before minDuration elapses
      progress += (target - progress) * 0.14;
      var elapsed = now - startTime;
      var display = Math.min(99, Math.round(progress));
      if(elapsed > minDuration && loaded >= total){ display = 100; }
      if(preloaderBar) preloaderBar.style.width = display + '%';
      if(preloaderPct) preloaderPct.textContent = display + '%';

      if(display >= 100){
        finishLoad();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    var finished = false;
    function finishLoad(){
      if(finished) return;
      finished = true;
      if(preloader) preloader.classList.add('is-done');
      body.classList.remove('is-loading');
      setTimeout(revealHero, 150);
    }
    // hard safety net in case something never loads
    setTimeout(finishLoad, 3200);
  }

  /* ---------------- Scroll progress rail ---------------- */
  var railFill = document.querySelector('.rail-fill');
  function updateRail(){
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if(railFill) railFill.style.height = pct + '%';
  }
  document.addEventListener('scroll', updateRail, { passive:true });
  updateRail();

  /* ---------------- Work index accordion ---------------- */
  var workItems = document.querySelectorAll('.work-item');
  workItems.forEach(function(item){
    var row = item.querySelector('.work-row');
    var panel = item.querySelector('.work-panel');
    if(!row || !panel) return;
    row.addEventListener('click', function(){
      var willOpen = !item.classList.contains('is-open');
      workItems.forEach(function(other){
        other.classList.remove('is-open');
        var otherRow = other.querySelector('.work-row');
        var otherPanel = other.querySelector('.work-panel');
        if(otherRow) otherRow.setAttribute('aria-expanded', 'false');
        if(otherPanel) otherPanel.style.maxHeight = '';
      });
      if(willOpen){
        item.classList.add('is-open');
        row.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
  window.addEventListener('resize', function(){
    var openItem = document.querySelector('.work-item.is-open');
    if(openItem){
      var openPanel = openItem.querySelector('.work-panel');
      if(openPanel) openPanel.style.maxHeight = openPanel.scrollHeight + 'px';
    }
  });

  /* ---------------- Count-up stats ---------------- */
  var counters = document.querySelectorAll('.stat-num');
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function(c){ cio.observe(c); });
  }
  function animateCount(el){
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if(reduceMotion){ el.textContent = target; return; }
    var start = null;
    var duration = 1100;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- Mobile menu ---------------- */
  var burger = document.querySelector('.nav-burger');
  var menu = document.querySelector('.mobile-menu');
  if(burger && menu){
    burger.addEventListener('click', function(){
      var open = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        menu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------- Magnetic hover ---------------- */
  if(!isTouch && !reduceMotion){
    document.querySelectorAll('[data-magnetic]').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var relX = e.clientX - (r.left + r.width / 2);
        var relY = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (relX * 0.28) + 'px,' + (relY * 0.32) + 'px)';
      });
      el.addEventListener('mouseleave', function(){
        el.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------------- Hero parallax ---------------- */
  var heroContours = document.querySelector('.hero-contours');
  var heroSection = document.querySelector('.hero');
  if(heroContours && heroSection && !reduceMotion){
    document.addEventListener('scroll', function(){
      var rect = heroSection.getBoundingClientRect();
      if(rect.bottom < 0 || rect.top > window.innerHeight) return;
      var offset = window.scrollY * 0.12;
      heroContours.style.transform = 'translate3d(0,' + offset + 'px,0)';
    }, { passive:true });
  }

  /* ---------------- Contour drift (ambient, gentle) ---------------- */
  if(!reduceMotion){
    document.querySelectorAll('.cline').forEach(function(path, i){
      path.style.animation = 'driftline ' + (18 + i * 4) + 's ease-in-out infinite';
      path.style.animationDelay = (-i * 3) + 's';
    });
    var styleTag = document.createElement('style');
    styleTag.textContent = '@keyframes driftline{0%,100%{transform:translateY(0px);}50%{transform:translateY(-14px);}}';
    document.head.appendChild(styleTag);
  }

})();
