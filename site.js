
(function(){
  var btn = document.getElementById('copy'); if (!btn) return;
  btn.addEventListener('click', function(){
    var el = document.getElementById('mail'), status = document.getElementById('status');
    function fallback(){
      var r = document.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      status.textContent = 'Selected. Press Ctrl+C to copy.';
    }
    try { navigator.clipboard.writeText(el.textContent).then(function(){ status.textContent = 'Copied'; }, fallback); }
    catch(e){ fallback(); }
  });
})();
// Rotating figures: curve families from the research lines, drawn by this page
(function(){
  var canvas = document.getElementById('art'); if (!canvas) return;
  var titleEl = document.getElementById('capTitle'), bodyEl = document.getElementById('capBody');
  var dotsEl = document.getElementById('dots'), pauseBtn = document.getElementById('pause');
  var C = {blue:'#1a1f6c', orange:'#ff5700', beige:'#d6d1c4', light:'#d2e0f3', white:'#ffffff'};
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  function sample(f, a, b, n){ var pts = []; for (var i = 0; i <= n; i++){ var t = a + (b - a) * i / n; pts.push(f(t)); } return pts; }
  function mix(i, n){ // light blue -> beige for the family members
    var f = n <= 1 ? 0 : i / (n - 1), A = [210,224,243], B = [214,209,196];
    return 'rgb(' + A.map(function(v, k){ return Math.round(v + (B[k] - v) * f); }).join(',') + ')';
  }

  var slides = [
    {
      title: 'Offsets of an ellipse',
      body: 'Curves at constant distance d = 0.3 to 1.5 from the ellipse x²/4 + y² = 1 (orange). The inner offsets develop cusps and self-intersections.',
      label: 'Offset curves of an ellipse at five distances on both sides',
      cx: 0, cy: 0, half: 3.7,
      build: function(){
        var out = [], ds = [0.3, 0.6, 0.9, 1.2, 1.5];
        ds.forEach(function(d, i){
          [1, -1].forEach(function(sg){
            out.push({c: mix(i, ds.length), w: 1.4, pts: sample(function(t){
              var x = 2*Math.cos(t), y = Math.sin(t), nx = Math.cos(t)/2, ny = Math.sin(t), L = Math.hypot(nx, ny);
              return [x + sg*d*nx/L, y + sg*d*ny/L];
            }, 0, 2*Math.PI, 700)});
          });
        });
        out.push({c: C.orange, w: 2.6, pts: sample(function(t){ return [2*Math.cos(t), Math.sin(t)]; }, 0, 2*Math.PI, 400)});
        return out;
      }
    },
    {
      title: 'Conchoids of Nicomedes',
      body: 'Conchoids of the line x = 1 (orange) from the origin, r = 1/cos θ ± d, for d = 0.5 to 2.5. For d > 1 the inner branch forms a loop.',
      label: 'Family of conchoids of Nicomedes of a vertical line',
      cx: 0.9, cy: 0, half: 3.3,
      build: function(){
        var out = [], ds = [0.5, 1, 1.5, 2, 2.5], lim = 1.42;
        ds.forEach(function(d, i){
          [1, -1].forEach(function(sg){
            out.push({c: mix(i, ds.length), w: 1.4, pts: sample(function(t){
              var r = 1/Math.cos(t) + sg*d; return [r*Math.cos(t), r*Math.sin(t)];
            }, -lim, lim, 700)});
          });
        });
        out.push({c: C.orange, w: 2.6, pts: [[1, -4], [1, 4]]});
        return out;
      }
    },
    {
      title: 'Conchoids of a circle: limaçons of Pascal',
      body: 'Conchoids of the circle r = 2 cos θ (orange) from a point on it, r = 2 cos θ + d, for d = 0.5 to 3. At d = 2 the limaçon becomes a cardioid.',
      label: 'Family of limaçons of Pascal around a circle',
      cx: 1.2, cy: 0, half: 3.9,
      build: function(){
        var out = [], ds = [0.5, 1, 1.5, 2, 2.5, 3];
        ds.forEach(function(d, i){
          out.push({c: d === 2 ? C.white : mix(i, ds.length), w: d === 2 ? 2 : 1.4, pts: sample(function(t){
            var r = 2*Math.cos(t) + d; return [r*Math.cos(t), r*Math.sin(t)];
          }, 0, 2*Math.PI, 700)});
        });
        out.push({c: C.orange, w: 2.6, pts: sample(function(t){ return [1 + Math.cos(t), Math.sin(t)]; }, 0, 2*Math.PI, 300)});
        return out;
      }
    },
    {
      title: 'Trigonometric parametrizations',
      body: 'Hypotrochoids x = 2 cos t + d cos(2t/3), y = 2 sin t − d sin(2t/3), for d = 0.6 to 3. Curves of this kind are algebraic and admit a trigonometric parametrization.',
      label: 'Family of hypotrochoids with a trigonometric parametrization',
      cx: 0, cy: 0, half: 5.4,
      build: function(){
        var out = [], ds = [0.6, 1.2, 1.8, 2.4, 3];
        ds.forEach(function(d, i){
          out.push({c: i === ds.length - 1 ? C.orange : mix(i, ds.length - 1), w: i === ds.length - 1 ? 2.2 : 1.4, pts: sample(function(t){
            return [2*Math.cos(t) + d*Math.cos(2*t/3), 2*Math.sin(t) - d*Math.sin(2*t/3)];
          }, 0, 6*Math.PI, 1400)});
        });
        return out;
      }
    }
  ];
  slides.forEach(function(s){ s.curves = s.build(); });

  var current = 0, progress = 1, startT = 0, raf = 0, timer = 0, paused = reduce;
  var DRAW_MS = 1800, HOLD_MS = 6500;

  function draw(){
    var size = Math.max(200, Math.round(canvas.clientWidth || 360));
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(size * dpr);
    if (canvas.width !== W){ canvas.width = W; canvas.height = W; }
    var ctx = canvas.getContext('2d'), s = slides[current];
    ctx.fillStyle = C.blue; ctx.fillRect(0, 0, W, W);
    var sc = W / (2 * s.half);
    function X(x){ return (x - s.cx + s.half) * sc; }
    function Y(y){ return (s.half - (y - s.cy)) * sc; }
    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = dpr;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), W); ctx.stroke();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    s.curves.forEach(function(cv){
      var n = cv.pts.length, m = Math.max(2, Math.ceil(n * progress));
      ctx.strokeStyle = cv.c; ctx.lineWidth = cv.w * dpr;
      ctx.beginPath();
      var pen = false;
      for (var i = 0; i < m; i++){
        var p = cv.pts[i], x = X(p[0]), y = Y(p[1]);
        if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 4*W || Math.abs(y) > 4*W){ pen = false; continue; }
        if (!pen){ ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  function animate(now){
    if (!startT) startT = now;
    progress = Math.min(1, (now - startT) / DRAW_MS);
    progress = 1 - Math.pow(1 - progress, 3);
    draw();
    if (progress < 1) raf = requestAnimationFrame(animate);
  }

  function show(i, animateIt){
    current = (i + slides.length) % slides.length;
    var s = slides[current];
    titleEl.textContent = s.title; bodyEl.textContent = s.body;
    canvas.setAttribute('aria-label', s.label);
    Array.prototype.forEach.call(dotsEl.children, function(b, k){ b.setAttribute('aria-current', k === current ? 'true' : 'false'); });
    cancelAnimationFrame(raf);
    if (animateIt && !reduce){ progress = 0; startT = 0; raf = requestAnimationFrame(animate); }
    else { progress = 1; draw(); }
    schedule();
  }
  function schedule(){
    clearTimeout(timer);
    if (!paused) timer = setTimeout(function(){ show(current + 1, true); }, HOLD_MS);
  }

  slides.forEach(function(s, k){
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', 'Show figure ' + (k + 1) + ': ' + s.title);
    b.addEventListener('click', function(){ show(k, true); });
    dotsEl.appendChild(b);
  });
  function setPaused(p){
    paused = p;
    pauseBtn.textContent = p ? 'Play' : 'Pause';
    pauseBtn.setAttribute('aria-label', p ? 'Resume rotation' : 'Pause rotation');
    schedule();
  }
  pauseBtn.addEventListener('click', function(){ setPaused(!paused); });
  setPaused(paused);
  document.addEventListener('visibilitychange', function(){ if (document.hidden) clearTimeout(timer); else schedule(); });

  show(0, false);
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(draw, 150); });
})();
