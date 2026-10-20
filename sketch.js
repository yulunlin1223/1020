// 宣告全域變數：儲存圖片/GIF資源
let headerGif;
let gifLoaded = false; // 追蹤 GIF 是否成功載入

// 宣告全域變數：儲存 6 個拖曳選項物件
let options = [];

// 宣告全域變數：儲存放置目標框物件 (6 個放置區)
let dropZones = [];

// 宣告全域變數：儲存彩帶粒子陣列
let confettiParticles = [];

// 宣告全域變數：控制是否顯示成績結果
let showResult = false;

// 宣告全域變數：紀錄最後得分 (百分比)
let finalScore = 0;

// 宣告全域變數：紀錄是否已交卷並通過 (分數 >= 60%)
let isPassed = false;

// 宣告全域變數：目前被滑鼠選取拖曳中的選項索引 (-1 表示無)
let draggedOptionIndex = -1;

// 宣告全域變數：滑鼠與被拖曳選項左上角的 X 軸偏移量
let offsetX = 0;

// 宣告全域變數：滑鼠與被拖曳選項左上角的 Y 軸偏移量
let offsetY = 0;

// 宣告題目資料陣列 (6 題 p5.js 基礎指令題)
const quizData = [
  { id: 0, text: "createCanvas()", targetText: "建立畫布大小" },
  { id: 1, text: "background()", targetText: "設定背景顏色" },
  { id: 2, text: "fill()", targetText: "設定填滿顏色" },
  { id: 3, text: "rect()", targetText: "繪製矩形形狀" },
  { id: 4, text: "ellipse()", targetText: "繪製圓形/橢圓" },
  { id: 5, text: "stroke()", targetText: "設定邊框顏色" }
];

// p5.js 預載入函式：負責在程式啟動前載入圖片或外部資源
function preload() {
  // 使用穩定可靠的動態 GIF 來源（或可自行替換為專案內的本地檔名如 "animation.gif"）
  headerGif = loadImage(
    "https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif",
    () => {
      gifLoaded = true; // 成功載入回調
    },
    (err) => {
      console.log("GIF 載入失敗，將啟用文字標題替代方案", err);
      gifLoaded = false;
    }
  );
}

// p5.js 初始化設定函式：僅執行一次
function setup() {
  // 建立全螢幕畫布，自動適應當前瀏覽器視窗寬高
  createCanvas(windowWidth, windowHeight);
  
  // 設定文字對齊方式為水平居中與垂直居中
  textAlign(CENTER, CENTER);
  
  // 初始化畫面上所有的選項與放置區域位置
  initGameElements();
}

// 初始化遊戲元素 positions 與數據
function initGameElements() {
  // 清空選項與目標區陣列
  options = [];
  dropZones = [];
  confettiParticles = [];
  showResult = false;
  isPassed = false;

  // 計算頂部 GIF 圖片的顯示尺寸與位置
  let gifW = min(width * 0.8, 200); // 限制寬度
  let gifH = gifW * 0.4; 
  let gifY = 55; 

  // 計算下方放置區與選項區的卡片尺寸
  let cardW = min((width - 80) / 3, 180); // 每列 3 個放置區，計算單一卡片寬度
  let cardH = 50; // 卡片高度固定 50px
  let startY = gifY + gifH + 35; // 放置區起始 Y 座標

  // 隨機打亂題目選項順序，增加測驗趣味性
  let shuffledData = shuffle([...quizData]);

  // 迴圈建立 6 個目標放置區 (Drop Zones) 與可拖曳選項 (Options)
  for (let i = 0; i < 6; i++) {
    // 計算欄位 (0, 1, 2) 與列位 (0, 1)
    let col = i % 3;
    let row = floor(i / 3);
    
    // 計算每個放置區卡片的 X 與 Y 座標
    let zoneX = (width - (cardW * 3 + 40)) / 2 + col * (cardW + 20);
    let zoneY = startY + row * (cardH + 35);

    // 建立目標放置區物件並存入陣列
    dropZones.push({
      x: zoneX, // 放置區 X 座標
      y: zoneY, // 放置區 Y 座標
      w: cardW, // 放置區寬度
      h: cardH, // 放置區高度
      label: quizData[i].targetText, // 提示文字 (如：建立畫布大小)
      correctId: quizData[i].id, // 正確對應的指令 ID
      placedOptionId: null // 目前放置於此區域的選項 ID
    });

    // 計算初始選項顯示於底部的擺放位置
    let optCol = i % 3;
    let optRow = floor(i / 3);
    let optX = (width - (cardW * 3 + 40)) / 2 + optCol * (cardW + 20);
    let optY = startY + 2 * (cardH + 35) + 25 + optRow * (cardH + 12);

    // 建立可拖曳選項物件並存入陣列
    options.push({
      id: shuffledData[i].id, // 指令的真實 ID
      text: shuffledData[i].text, // 指令名稱 (如：createCanvas())
      x: optX, // 當前 X 座標
      y: optY, // 當前 Y 座標
      homeX: optX, // 預設歸位 X 座標
      homeY: optY, // 預設歸位 Y 座標
      w: cardW, // 選項卡片寬度
      h: cardH, // 選項卡片高度
      isPlaced: false // 是否已被放入目標區
    });
  }
}

// p5.js 主要繪製迴圈函式：每秒預設執行約 60 次
function draw() {
  // 設定繪圖背景顏色為淺灰色/柔和藍灰色
  background(240, 244, 248);

  // 繪製頂部測驗標題與動畫
  drawHeader();

  // 繪製放置區 (題目配對區域)
  drawDropZones();

  // 繪製下方可拖曳的選項卡片
  drawOptions();

  // 檢查是否所有選項皆已放置到目標區
  let allPlaced = options.every(opt => opt.isPlaced);

  // 如果全部放置完成且尚未交卷，顯示「交卷看成績」按鈕
  if (allPlaced && !showResult) {
    drawSubmitButton();
  }

  // 若已交卷，顯示最終成績結果卡片
  if (showResult) {
    drawResultCard();
  }

  // 若分數高於 60% 且已交卷，繪製並更新彩帶動畫效果
  if (isPassed && showResult) {
    updateAndDrawConfetti();
  }
}

// 繪製頂部標題與 GIF 圖片
function drawHeader() {
  // 設定主標題文字顏色與大小
  fill(30, 41, 59);
  textSize(min(width * 0.04, 24));
  textStyle(BOLD);
  text("p5.js 程式設計拖曳測驗", width / 2, 25);

  // 計算 GIF 顯示尺寸
  let gifW = min(width * 0.6, 160);
  let gifH = gifW * 0.35;
  let gifX = (width - gifW) / 2;
  let gifY = 42;

  // 判斷 GIF 是否成功讀取，若成功則繪製圖片，否則繪製漂亮的替代裝飾框
  if (gifLoaded && headerGif) {
    image(headerGif, gifX, gifY, gifW, gifH);
  } else {
    // 替代顯示框（當網路或外部圖源無法讀取時避免畫面空白）
    fill(219, 234, 254);
    noStroke();
    rect(gifX, gifY, gifW, gifH, 8);
    fill(37, 99, 235);
    textSize(12);
    text("✨ p5.js互動學習區 ✨", width / 2, gifY + gifH / 2);
  }
}

// 繪製題目放置區
function drawDropZones() {
  for (let zone of dropZones) {
    stroke(148, 163, 184);
    strokeWeight(2);
    
    if (zone.placedOptionId !== null) {
      fill(224, 242, 254);
    } else {
      fill(255, 255, 255, 200);
    }
    
    rect(zone.x, zone.y, zone.w, zone.h, 10);

    noStroke();
    fill(71, 85, 105);
    textSize(14);
    textStyle(NORMAL);
    text(zone.label, zone.x + zone.w / 2, zone.y + zone.h / 2);
  }
}

// 繪製可拖曳的選項卡片
function drawOptions() {
  for (let i = 0; i < options.length; i++) {
    let opt = options[i];

    if (i === draggedOptionIndex) {
      fill(59, 130, 246); 
      stroke(37, 99, 235);
      strokeWeight(3);
    } else {
      fill(255); 
      stroke(203, 213, 225);
      strokeWeight(1.5);
    }

    rect(opt.x, opt.y, opt.w, opt.h, 8);

    noStroke();
    fill(i === draggedOptionIndex ? 255 : 15, 23, 42);
    textSize(15);
    textStyle(BOLD);
    text(opt.text, opt.x + opt.w / 2, opt.y + opt.h / 2);
  }
}

// 繪製「交卷看成績」按鈕
function drawSubmitButton() {
  let btnW = 160;
  let btnH = 42;
  let btnX = (width - btnW) / 2;
  let btnY = height - 60;

  let isHover = mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH;

  fill(isHover ? 22 : 16, isHover ? 163 : 185, isHover ? 74 : 129); 
  noStroke();
  rect(btnX, btnY, btnW, btnH, 22);

  fill(255);
  textSize(15);
  textStyle(BOLD);
  text("交卷看成績", width / 2, btnY + btnH / 2);
}

// 繪製最終測驗成績結果面板
function drawResultCard() {
  fill(0, 0, 0, 100);
  rect(0, 0, width, height);

  let cardW = min(width * 0.8, 340);
  let cardH = 200;
  let cardX = (width - cardW) / 2;
  let cardY = (height - cardH) / 2;

  fill(255);
  stroke(226, 232, 240);
  strokeWeight(2);
  rect(cardX, cardY, cardW, cardH, 16);

  noStroke();
  fill(30, 41, 59);
  textSize(20);
  textStyle(BOLD);
  text("測驗結果", width / 2, cardY + 35);

  textSize(32);
  fill(isPassed ? 22 : 220, isPassed ? 163 : 38, isPassed ? 74 : 38);
  text(finalScore.toFixed(0) + " 分", width / 2, cardY + 85);

  textSize(15);
  fill(100, 116, 139);
  textStyle(NORMAL);
  text(isPassed ? "🎉 恭喜通過！掌握得很棒！" : "💪 再接再厲，再試一次吧！", width / 2, cardY + 125);

  let retryBtnW = 110;
  let retryBtnH = 32;
  let retryBtnX = (width - retryBtnW) / 2;
  let retryBtnY = cardY + cardH - 45;

  fill(59, 130, 246);
  rect(retryBtnX, retryBtnY, retryBtnW, retryBtnH, 16);

  fill(255);
  textSize(13);
  textStyle(BOLD);
  text("重新測驗", width / 2, retryBtnY + retryBtnH / 2);
}

// 當滑鼠按下時觸發的事件函式
function mousePressed() {
  if (showResult) {
    let cardW = min(width * 0.8, 340);
    let cardH = 200;
    let cardY = (height - cardH) / 2;
    let retryBtnW = 110;
    let retryBtnH = 32;
    let retryBtnX = (width - retryBtnW) / 2;
    let retryBtnY = cardY + cardH - 45;

    if (mouseX > retryBtnX && mouseX < retryBtnX + retryBtnW && mouseY > retryBtnY && mouseY < retryBtnY + retryBtnH) {
      initGameElements(); 
    }
    return;
  }

  let allPlaced = options.every(opt => opt.isPlaced);
  if (allPlaced) {
    let btnW = 160;
    let btnH = 42;
    let btnX = (width - btnW) / 2;
    let btnY = height - 60;
    if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      calculateScore(); 
      return;
    }
  }

  for (let i = options.length - 1; i >= 0; i--) {
    let opt = options[i];
    if (mouseX > opt.x && mouseX < opt.x + opt.w && mouseY > opt.y && mouseY < opt.y + opt.h) {
      draggedOptionIndex = i; 
      offsetX = mouseX - opt.x; 
      offsetY = mouseY - opt.y; 

      for (let zone of dropZones) {
        if (zone.placedOptionId === opt.id) {
          zone.placedOptionId = null;
        }
      }
      opt.isPlaced = false;
      break;
    }
  }
}

// 當滑鼠拖拽移動時觸發的事件函式
function mouseDragged() {
  if (draggedOptionIndex !== -1) {
    options[draggedOptionIndex].x = mouseX - offsetX;
    options[draggedOptionIndex].y = mouseY - offsetY;
  }
}

// 當滑鼠放開時觸發的事件函式
function mouseReleased() {
  if (draggedOptionIndex !== -1) {
    let opt = options[draggedOptionIndex];
    let placed = false;

    for (let zone of dropZones) {
      let centerX = opt.x + opt.w / 2;
      let centerY = opt.y + opt.h / 2;

      if (centerX > zone.x && centerX < zone.x + zone.w && centerY > zone.y && centerY < zone.y + zone.h) {
        if (zone.placedOptionId !== null) {
          let prevOpt = options.find(o => o.id === zone.placedOptionId);
          if (prevOpt) {
            prevOpt.x = prevOpt.homeX;
            prevOpt.y = prevOpt.homeY;
            prevOpt.isPlaced = false;
          }
        }

        opt.x = zone.x;
        opt.y = zone.y;
        opt.isPlaced = true;
        zone.placedOptionId = opt.id;
        placed = true;
        break;
      }
    }

    if (!placed) {
      opt.x = opt.homeX;
      opt.y = opt.homeY;
      opt.isPlaced = false;
    }

    draggedOptionIndex = -1;
  }
}

// 計算測驗成績函式
function calculateScore() {
  let correctCount = 0;

  for (let zone of dropZones) {
    if (zone.placedOptionId === zone.correctId) {
      correctCount++; 
    }
  }

  finalScore = (correctCount / dropZones.length) * 100;
  showResult = true; 

  if (finalScore >= 60) {
    isPassed = true;
    createConfetti(); 
  } else {
    isPassed = false;
  }
}

// 建立滿天彩帶粒子的初始化函式
function createConfetti() {
  confettiParticles = [];
  let colors = [
    color(239, 68, 68),   
    color(245, 158, 11),  
    color(34, 197, 94),   
    color(59, 130, 246),  
    color(168, 85, 247)   
  ];

  for (let i = 0; i < 120; i++) {
    confettiParticles.push({
      x: random(width), 
      y: random(-height, 0), 
      size: random(6, 12), 
      color: random(colors), 
      speedY: random(2, 5), 
      speedX: random(-1.5, 1.5), 
      rotation: random(TWO_PI), 
      rotSpeed: random(-0.1, 0.1) 
    });
  }
}

// 更新並繪製彩帶粒子的動態效果
function updateAndDrawConfetti() {
  noStroke();
  for (let p of confettiParticles) {
    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    fill(p.color);
    rect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    pop();

    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotSpeed;

    if (p.y > height) {
      p.y = -10;
      p.x = random(width);
    }
  }
}

// 響應式網頁設計：當瀏覽器視窗大小改變時自動觸發
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGameElements();
}